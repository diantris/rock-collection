// PhotoService.java - Photo upload, ordering and deletion; full photos go to the Pages repo, the thumbnail to the DB
package com.rockcollection.photo;

import com.rockcollection.common.BadRequestException;
import com.rockcollection.common.NotFoundException;
import com.rockcollection.github.GitHubClient;
import com.rockcollection.github.GitHubException;
import com.rockcollection.specimen.SpecimenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Photos are public as soon as they're uploaded (they're in the public Pages repo), whether or not the specimen
 * is published. The cover photo (position 0) is the one the table thumbnail is made from.
 */
@Service
public class PhotoService {

    private static final Logger log = LoggerFactory.getLogger(PhotoService.class);
    static final String THUMBNAIL_TYPE = "image/jpeg";

    private final SpecimenRepository specimenRepository;
    private final SpecimenPhotoRepository photoRepository;
    private final SpecimenThumbnailRepository thumbnailRepository;
    private final ImageProcessor imageProcessor;
    private final GitHubClient gitHub;
    private final SecureRandom random = new SecureRandom();

    public PhotoService(SpecimenRepository specimenRepository, SpecimenPhotoRepository photoRepository,
                        SpecimenThumbnailRepository thumbnailRepository, ImageProcessor imageProcessor, GitHubClient gitHub) {
        this.specimenRepository = specimenRepository;
        this.photoRepository = photoRepository;
        this.thumbnailRepository = thumbnailRepository;
        this.imageProcessor = imageProcessor;
        this.gitHub = gitHub;
    }

    /** A specimen's photos, cover first. */
    @Transactional(readOnly = true)
    public List<PhotoDto> list(Long specimenId) {
        requireSpecimen(specimenId);
        return toDtos(photos(specimenId));
    }

    /**
     * Resizes the photos, strips their metadata and commits them all to the Pages repo in one commit,
     * each with a small copy for the public site's index.
     * The first photo of a specimen that had none also becomes its thumbnail.
     * <p>
     * Deliberately not {@code @Transactional} (the class isn't either): processing (one photo at a time, other
     * uploads wait) and the GitHub commit can take a while, and a transaction, or even Spring's non-transactional
     * session scope, would hold a database connection all along, so a few queued uploads could leave none for the
     * rest of the app. Each repository call below borrows a connection only for its own short transaction.
     */
    public List<PhotoDto> upload(Long specimenId, List<MultipartFile> files) {
        requireSpecimen(specimenId);
        if (files == null || files.isEmpty()) throw new BadRequestException("No photos were sent");
        if (!gitHub.isConfigured()) {
            throw new GitHubException("The GitHub Pages repo isn't set up: GITHUB_TOKEN is missing (see .env.example)");
        }

        List<SpecimenPhoto> existing = photos(specimenId);
        int position = existing.isEmpty() ? 0 : existing.getLast().getPosition() + 1;
        Map<String, byte[]> uploads = new LinkedHashMap<>();
        List<SpecimenPhoto> created = new ArrayList<>();
        for (MultipartFile file : files) {
            ImageProcessor.Image image = process(file);
            String path = "photos/%d/%d-%s.jpg".formatted(specimenId, specimenId, randomSuffix());
            uploads.put(path, image.data());
            uploads.put(SpecimenPhoto.smallFileName(path), imageProcessor.toSmallPhoto(image.data()).data());
            created.add(new SpecimenPhoto(specimenId, path, position++, image.width(), image.height()));
        }

        gitHub.commit("Add %d photo%s to specimen #%d".formatted(files.size(), files.size() == 1 ? "" : "s", specimenId),
                uploads, List.of());
        photoRepository.saveAll(created);
        if (existing.isEmpty()) saveThumbnail(specimenId, uploads.values().iterator().next());
        return toDtos(photos(specimenId));
    }

    /**
     * Puts the photos in the given order; the first becomes the cover.
     * @param photoIds every photo id of the specimen, each exactly once
     */
    @Transactional
    public List<PhotoDto> reorder(Long specimenId, List<Long> photoIds) {
        requireSpecimen(specimenId);
        List<SpecimenPhoto> photos = photos(specimenId);
        Map<Long, SpecimenPhoto> byId = photos.stream().collect(Collectors.toMap(SpecimenPhoto::getId, p -> p));
        if (photoIds == null || photoIds.size() != photos.size() || !byId.keySet().equals(new HashSet<>(photoIds))) {
            throw new BadRequestException("The new order must list each of the specimen's photos exactly once");
        }
        Long oldCover = photos.isEmpty() ? null : photos.getFirst().getId();
        for (int i = 0; i < photoIds.size(); i++) byId.get(photoIds.get(i)).setPosition(i);
        List<SpecimenPhoto> ordered = photoIds.stream().map(byId::get).toList();
        if (!ordered.isEmpty() && !ordered.getFirst().getId().equals(oldCover)) refreshThumbnail(specimenId, ordered);
        return toDtos(ordered);
    }

    /** Removes the photo from the Pages repo and the gallery; deleting the cover makes the next photo the cover. */
    @Transactional
    public void delete(Long specimenId, Long photoId) {
        requireSpecimen(specimenId);
        List<SpecimenPhoto> photos = new ArrayList<>(photos(specimenId));
        SpecimenPhoto photo = photos.stream().filter(p -> p.getId().equals(photoId)).findFirst()
                .orElseThrow(() -> new NotFoundException("Photo", photoId));
        boolean wasCover = photos.getFirst() == photo;

        gitHub.commit("Remove a photo from specimen #" + specimenId, Map.of(), photo.getAllFileNames());
        photoRepository.delete(photo);
        photos.remove(photo);
        for (int i = 0; i < photos.size(); i++) photos.get(i).setPosition(i);
        if (wasCover) refreshThumbnail(specimenId, photos);
    }

    /**
     * Removes all of a specimen's photo files from the Pages repo, before the specimen itself is deleted
     * (its photo and thumbnail rows go with it). Best effort: if GitHub can't be reached the files stay behind.
     */
    @Transactional
    public void deleteAllFiles(Long specimenId) {
        List<String> paths = photos(specimenId).stream().flatMap(p -> p.getAllFileNames().stream()).toList();
        if (paths.isEmpty()) return;
        try {
            gitHub.commit("Remove the photos of deleted specimen #" + specimenId, Map.of(), paths);
        } catch (GitHubException e) {
            log.warn("Specimen #{} is deleted, but its photos are still in the Pages repo: {}", specimenId, paths, e);
        }
    }

    @Transactional(readOnly = true)
    public SpecimenThumbnail thumbnail(Long specimenId) {
        return thumbnailRepository.findById(specimenId).orElseThrow(() -> new NotFoundException("Thumbnail", specimenId));
    }

    /** specimen id → thumbnail version (epoch millis), for the specimens that have one. */
    @Transactional(readOnly = true)
    public Map<Long, Long> thumbnailVersions(Collection<Long> specimenIds) {
        if (specimenIds.isEmpty()) return Map.of();
        return thumbnailRepository.findVersions(specimenIds).stream()
                .collect(Collectors.toMap(ThumbnailVersion::specimenId, v -> v.updatedAt().toEpochMilli()));
    }

    /** Remakes the thumbnail from the current cover photo, downloaded back from the Pages repo. */
    private void refreshThumbnail(Long specimenId, List<SpecimenPhoto> ordered) {
        if (ordered.isEmpty()) {
            thumbnailRepository.deleteById(specimenId);
            return;
        }
        saveThumbnail(specimenId, gitHub.download(ordered.getFirst().getFileName()));
    }

    private void saveThumbnail(Long specimenId, byte[] photo) {
        SpecimenThumbnail thumbnail = thumbnailRepository.findById(specimenId).orElseGet(() -> new SpecimenThumbnail(specimenId));
        thumbnail.replace(THUMBNAIL_TYPE, imageProcessor.toThumbnail(photo));
        thumbnailRepository.save(thumbnail);
    }

    private ImageProcessor.Image process(MultipartFile file) {
        try {
            return imageProcessor.toWebPhoto(file.getBytes());
        } catch (BadRequestException e) {
            throw new BadRequestException(file.getOriginalFilename() + ": " + e.getMessage());
        } catch (IOException e) {
            throw new BadRequestException(file.getOriginalFilename() + ": the upload couldn't be read");
        }
    }

    private List<SpecimenPhoto> photos(Long specimenId) {
        return photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(specimenId);
    }

    private List<PhotoDto> toDtos(List<SpecimenPhoto> photos) {
        return photos.stream().map(p -> PhotoDto.from(p, gitHub.rawUrl(p.getFileName()), gitHub.rawUrl(p.getSmallFileName()))).toList();
    }

    private void requireSpecimen(Long specimenId) {
        if (!specimenRepository.existsById(specimenId)) throw new NotFoundException("Specimen", specimenId);
    }

    /** 8 random hex digits: file names never repeat, so cached copies of a removed photo can't show up again. */
    private String randomSuffix() {
        return HexFormat.of().toHexDigits(random.nextInt());
    }
}
