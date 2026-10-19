// PhotoController.java - REST endpoints for a specimen's photos and its table thumbnail
package com.rockcollection.photo;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/specimens/{specimenId}")
public class PhotoController {

    private final PhotoService photoService;

    public PhotoController(PhotoService photoService) {
        this.photoService = photoService;
    }

    @GetMapping("/photos")
    public List<PhotoDto> list(@PathVariable Long specimenId) {
        return photoService.list(specimenId);
    }

    /** Multipart upload of one or more images in the {@code files} part; returns all photos of the specimen. */
    @PostMapping(path = "/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public List<PhotoDto> upload(@PathVariable Long specimenId, @RequestParam("files") List<MultipartFile> files) {
        return photoService.upload(specimenId, files);
    }

    /** Body: every photo id in the new order; the first becomes the cover. */
    @PutMapping("/photos/order")
    public List<PhotoDto> reorder(@PathVariable Long specimenId, @RequestBody List<Long> photoIds) {
        return photoService.reorder(specimenId, photoIds);
    }

    @DeleteMapping("/photos/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long specimenId, @PathVariable Long photoId) {
        photoService.delete(specimenId, photoId);
    }

    /**
     * The table thumbnail. The table adds {@code ?v=<thumbnailVersion>}, which changes whenever the thumbnail
     * does, so a versioned URL can be cached for good.
     */
    @GetMapping("/thumbnail")
    public ResponseEntity<byte[]> thumbnail(@PathVariable Long specimenId, @RequestParam(required = false) Long v) {
        SpecimenThumbnail thumbnail = photoService.thumbnail(specimenId);
        CacheControl cache = v != null ? CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable() : CacheControl.noCache();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(thumbnail.getContentType()))
                .cacheControl(cache)
                .body(thumbnail.getData());
    }
}
