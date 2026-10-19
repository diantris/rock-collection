package com.rockcollection.publish;

import com.rockcollection.github.GitHubClient;
import com.rockcollection.photo.SpecimenPhotoRepository;
import com.rockcollection.specimen.Specimen;
import com.rockcollection.specimen.SpecimenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;
import java.util.function.Predicate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublishServiceTest {
    @Mock private PublishSettingsRepository settingsRepository;
    @Mock private SpecimenRepository specimenRepository;
    @Mock private SpecimenPhotoRepository photoRepository;
    @Mock private GitHubClient gitHub;

    private PublishService service;

    @BeforeEach
    void setUp() {
        service = new PublishService(settingsRepository, specimenRepository, photoRepository, new SiteGenerator(), gitHub);
        lenient().when(settingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(gitHub.isConfigured()).thenReturn(true);
        lenient().when(gitHub.pagesUrl()).thenReturn("https://owner.github.io/pages/");
    }

    @Test
    void settings_firstTime_areCreatedWithTheEvidenceFieldsTicked() {
        when(settingsRepository.findById(PublishSettings.ID)).thenReturn(Optional.empty());

        PublishDto.Settings settings = service.settings();

        Map<PublishField, Boolean> ticked = new EnumMap<>(PublishField.class);
        settings.fields().forEach(f -> ticked.put(f.key(), f.included()));
        assertThat(ticked).containsEntry(PublishField.HARDNESS, true).containsEntry(PublishField.IDENTITY, true)
                .containsEntry(PublishField.PRICE, false).containsEntry(PublishField.ACQUIRED_FROM, false)
                .containsEntry(PublishField.TAGS, false);
        assertThat(settings.intro()).isEqualTo(PublishService.DEFAULT_INTRO);
        assertThat(settings.fields().getFirst().group()).isEqualTo("What it is");
        verify(settingsRepository).save(any());
    }

    @Test
    void updateSettings_storesFieldNamesAndBlankIntroAsNull() {
        PublishSettings existing = new PublishSettings();
        when(settingsRepository.findById(PublishSettings.ID)).thenReturn(Optional.of(existing));

        service.updateSettings(new PublishDto.SettingsRequest(EnumSet.of(PublishField.STREAK, PublishField.COLOR), "   "));

        assertThat(existing.getFields()).containsExactly("COLOR", "STREAK");
        assertThat(existing.getIntro()).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void publish_commitsTheGeneratedSiteAndLeavesPhotosAlone() {
        PublishSettings settings = new PublishSettings();
        settings.setFields(new ArrayList<>(List.of("IDENTITY")));
        when(settingsRepository.findById(PublishSettings.ID)).thenReturn(Optional.of(settings));
        Specimen s = new Specimen();
        ReflectionTestUtils.setField(s, "id", 4L);
        s.setName("Agate");
        when(specimenRepository.findByPublishedTrueOrderByIdAsc()).thenReturn(List.of(s));
        when(photoRepository.findBySpecimenIdInOrderBySpecimenIdAscPositionAscIdAsc(List.of(4L))).thenReturn(List.of());
        when(gitHub.replaceAll(eq("Publish 1 specimen"), anyMap(), any())).thenReturn(Optional.of("abc123"));

        PublishDto.Result result = service.publish();

        ArgumentCaptor<Map<String, byte[]>> files = ArgumentCaptor.forClass(Map.class);
        ArgumentCaptor<Predicate<String>> managed = ArgumentCaptor.forClass(Predicate.class);
        verify(gitHub).replaceAll(eq("Publish 1 specimen"), files.capture(), managed.capture());
        assertThat(files.getValue()).containsKeys("index.html", "specimens/4/index.html");
        assertThat(managed.getValue().test("photos/4/4-abc.jpg")).isFalse();
        assertThat(result.changed()).isTrue();
        assertThat(result.siteUrl()).isEqualTo("https://owner.github.io/pages/");
        assertThat(settings.getLastCommit()).isEqualTo("abc123");
        assertThat(settings.getLastPublishedAt()).isNotNull();
    }

    @Test
    void publish_nothingChanged_reportsIt() {
        when(settingsRepository.findById(PublishSettings.ID)).thenReturn(Optional.of(new PublishSettings()));
        when(specimenRepository.findByPublishedTrueOrderByIdAsc()).thenReturn(List.of());
        when(gitHub.replaceAll(any(), anyMap(), any())).thenReturn(Optional.empty());

        assertThat(service.publish().changed()).isFalse();
    }

    @Test
    void publishAllSpecimens_marksEveryoneAndReturnsCounts() {
        when(settingsRepository.findById(PublishSettings.ID)).thenReturn(Optional.of(new PublishSettings()));
        when(specimenRepository.countByPublishedTrue()).thenReturn(12L);
        when(specimenRepository.count()).thenReturn(12L);

        PublishDto.Settings settings = service.publishAllSpecimens();

        verify(specimenRepository).publishAll();
        assertThat(settings.publicCount()).isEqualTo(12);
    }
}
