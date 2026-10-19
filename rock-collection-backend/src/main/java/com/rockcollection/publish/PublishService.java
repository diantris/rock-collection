// PublishService.java - Global publish settings, and regenerating the public site in the GitHub Pages repo
package com.rockcollection.publish;

import com.rockcollection.github.GitHubClient;
import com.rockcollection.photo.SpecimenPhoto;
import com.rockcollection.photo.SpecimenPhotoRepository;
import com.rockcollection.specimen.Specimen;
import com.rockcollection.specimen.SpecimenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PublishService {

    static final String DEFAULT_INTRO = """
            A personal collection of rocks, minerals and cabochons. Many of them are unidentified, or only tentatively \
            identified: each page shows the photos and what has been observed and measured so far.

            If you know what one of them is, or have an idea, please mention its number (#…) when you reply.""";

    private final PublishSettingsRepository settingsRepository;
    private final SpecimenRepository specimenRepository;
    private final SpecimenPhotoRepository photoRepository;
    private final SiteGenerator siteGenerator;
    private final GitHubClient gitHub;

    public PublishService(PublishSettingsRepository settingsRepository, SpecimenRepository specimenRepository,
                          SpecimenPhotoRepository photoRepository, SiteGenerator siteGenerator, GitHubClient gitHub) {
        this.settingsRepository = settingsRepository;
        this.specimenRepository = specimenRepository;
        this.photoRepository = photoRepository;
        this.siteGenerator = siteGenerator;
        this.gitHub = gitHub;
    }

    public PublishDto.Settings settings() {
        return toDto(load());
    }

    /** Saves which fields are published and the intro text; takes effect on the next publish. */
    public PublishDto.Settings updateSettings(PublishDto.SettingsRequest request) {
        PublishSettings settings = load();
        settings.setFields(request.fields().stream().map(Enum::name).sorted().collect(Collectors.toCollection(ArrayList::new)));
        settings.setIntro(request.intro() == null || request.intro().isBlank() ? null : request.intro().strip());
        return toDto(settingsRepository.save(settings));
    }

    /** Marks every specimen to show on the public site, so nobody has to flip hundreds of switches. */
    public PublishDto.Settings publishAllSpecimens() {
        specimenRepository.publishAll();
        return settings();
    }

    /**
     * Regenerates the whole site from the current data and commits it to the Pages repo in one commit.
     * Photos stay where they are; pages of specimens that are no longer public are removed.
     */
    public PublishDto.Result publish() {
        PublishSettings settings = load();
        List<Specimen> specimens = specimenRepository.findByPublishedTrueOrderByIdAsc();
        Map<Long, List<SpecimenPhoto>> photos = photoRepository
                .findBySpecimenIdInOrderBySpecimenIdAscPositionAscIdAsc(specimens.stream().map(Specimen::getId).toList())
                .stream().collect(Collectors.groupingBy(SpecimenPhoto::getSpecimenId, LinkedHashMap::new, Collectors.toList()));

        Map<String, byte[]> site = siteGenerator.generate(new SiteGenerator.Content(settings.getIntro(), fields(settings), specimens, photos));
        Optional<String> commit = gitHub.replaceAll(
                "Publish %d specimen%s".formatted(specimens.size(), specimens.size() == 1 ? "" : "s"), site, SiteGenerator::isGenerated);

        Instant now = Instant.now();
        settings.setLastPublishedAt(now);
        commit.ifPresent(settings::setLastCommit);
        settingsRepository.save(settings);
        return new PublishDto.Result(commit.isPresent(), specimens.size(), gitHub.pagesUrl(), now);
    }

    private PublishSettings load() {
        return settingsRepository.findById(PublishSettings.ID).orElseGet(() -> {
            PublishSettings defaults = new PublishSettings();
            defaults.setFields(Arrays.stream(PublishField.values()).filter(PublishField::includedByDefault).map(Enum::name)
                    .sorted().collect(Collectors.toCollection(ArrayList::new)));
            defaults.setIntro(DEFAULT_INTRO);
            return settingsRepository.save(defaults);
        });
    }

    /** Unknown names (e.g. a field that was removed) are ignored. */
    private static Set<PublishField> fields(PublishSettings settings) {
        Set<String> names = new HashSet<>(settings.getFields());
        return Arrays.stream(PublishField.values()).filter(f -> names.contains(f.name()))
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(PublishField.class)));
    }

    private PublishDto.Settings toDto(PublishSettings settings) {
        Set<PublishField> included = fields(settings);
        List<PublishDto.Field> fields = Arrays.stream(PublishField.values())
                .map(f -> new PublishDto.Field(f, f.label(), f.group().label(), included.contains(f))).toList();
        return new PublishDto.Settings(fields, settings.getIntro(), settings.getLastPublishedAt(),
                gitHub.isConfigured() ? gitHub.pagesUrl() : null,
                specimenRepository.countByPublishedTrue(), specimenRepository.count(), gitHub.isConfigured());
    }
}
