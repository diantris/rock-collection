package com.rockcollection.photo;

import com.rockcollection.common.BadRequestException;
import com.rockcollection.github.GitHubClient;
import com.rockcollection.github.GitHubException;
import com.rockcollection.specimen.SpecimenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {
    private static final long SPECIMEN = 7L;

    @Mock private SpecimenRepository specimenRepository;
    @Mock private SpecimenPhotoRepository photoRepository;
    @Mock private SpecimenThumbnailRepository thumbnailRepository;
    @Mock private ImageProcessor imageProcessor;
    @Mock private GitHubClient gitHub;

    private PhotoService service;

    @BeforeEach
    void setUp() {
        service = new PhotoService(specimenRepository, photoRepository, thumbnailRepository, imageProcessor, gitHub);
        lenient().when(specimenRepository.existsById(SPECIMEN)).thenReturn(true);
        lenient().when(gitHub.isConfigured()).thenReturn(true);
        lenient().when(gitHub.rawUrl(anyString())).thenAnswer(i -> "https://raw.test/" + i.getArgument(0));
    }

    private static SpecimenPhoto photo(long id, String fileName, int position) {
        SpecimenPhoto photo = new SpecimenPhoto(SPECIMEN, fileName, position, 1600, 1200);
        ReflectionTestUtils.setField(photo, "id", id);
        return photo;
    }

    private static MockMultipartFile upload(String name) {
        return new MockMultipartFile("files", name, "image/jpeg", new byte[]{1, 2, 3});
    }

    @Test
    @SuppressWarnings("unchecked")
    void upload_firstPhotos_areCommittedTogetherAndTheFirstBecomesTheThumbnail() {
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of());
        when(imageProcessor.toWebPhoto(any())).thenReturn(
                new ImageProcessor.Image(new byte[]{10}, 1600, 1200), new ImageProcessor.Image(new byte[]{20}, 900, 1600));
        when(imageProcessor.toSmallPhoto(any())).thenReturn(new ImageProcessor.Image(new byte[]{11}, 480, 360));
        when(imageProcessor.toThumbnail(any())).thenReturn(new byte[]{99});
        when(thumbnailRepository.findById(SPECIMEN)).thenReturn(Optional.empty());

        service.upload(SPECIMEN, List.of(upload("a.jpg"), upload("b.jpg")));

        ArgumentCaptor<Map<String, byte[]>> files = ArgumentCaptor.forClass(Map.class);
        verify(gitHub, times(1)).commit(eq("Add 2 photos to specimen #7"), files.capture(), eq(List.of()));
        // Each photo goes up with its small copy for the public site's index
        assertThat(files.getValue().keySet()).hasSize(4).allMatch(p -> p.matches("photos/7/7-[0-9a-f]{8}(-small)?\\.jpg"));
        assertThat(files.getValue().keySet()).filteredOn(p -> p.endsWith("-small.jpg")).hasSize(2);

        ArgumentCaptor<List<SpecimenPhoto>> saved = ArgumentCaptor.forClass(List.class);
        verify(photoRepository).saveAll(saved.capture());
        assertThat(saved.getValue()).extracting(SpecimenPhoto::getPosition).containsExactly(0, 1);
        assertThat(saved.getValue()).extracting(SpecimenPhoto::getHeight).containsExactly(1200, 1600);

        verify(imageProcessor).toThumbnail(new byte[]{10}); // made from the first (web-sized) photo
        ArgumentCaptor<SpecimenThumbnail> thumbnail = ArgumentCaptor.forClass(SpecimenThumbnail.class);
        verify(thumbnailRepository).save(thumbnail.capture());
        assertThat(thumbnail.getValue().getData()).containsExactly(99);
        assertThat(thumbnail.getValue().getUpdatedAt()).isNotNull();
    }

    @Test
    void upload_toSpecimenWithPhotos_appendsAndKeepsTheThumbnail() {
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of(photo(1, "photos/7/a.jpg", 0)));
        when(imageProcessor.toWebPhoto(any())).thenReturn(new ImageProcessor.Image(new byte[]{10}, 10, 10));
        when(imageProcessor.toSmallPhoto(any())).thenReturn(new ImageProcessor.Image(new byte[]{11}, 10, 10));

        service.upload(SPECIMEN, List.of(upload("c.jpg")));

        verify(gitHub).commit(eq("Add 1 photo to specimen #7"), anyMap(), anyList());
        verify(photoRepository).saveAll(argThat(list -> list.iterator().next().getPosition() == 1));
        verifyNoInteractions(thumbnailRepository);
    }

    @Test
    void upload_withoutGitHubToken_failsBeforeProcessingAnything() {
        doThrow(new GitHubException("GITHUB_TOKEN is missing")).when(gitHub).requireConfigured();

        assertThatThrownBy(() -> service.upload(SPECIMEN, List.of(upload("a.jpg")))).isInstanceOf(GitHubException.class);
        verifyNoInteractions(imageProcessor);
    }

    @Test
    void upload_badFile_namesItAndCommitsNothing() {
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of());
        when(imageProcessor.toWebPhoto(any())).thenThrow(new BadRequestException("Unsupported or damaged image"));

        assertThatThrownBy(() -> service.upload(SPECIMEN, List.of(upload("IMG_0001.HEIC"))))
                .isInstanceOf(BadRequestException.class).hasMessageStartingWith("IMG_0001.HEIC: ");
        verify(gitHub, never()).commit(any(), any(), any());
    }

    @Test
    void reorder_newCover_remakesTheThumbnailFromThePagesRepo() {
        SpecimenPhoto a = photo(1, "photos/7/a.jpg", 0), b = photo(2, "photos/7/b.jpg", 1);
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of(a, b));
        when(gitHub.download("photos/7/b.jpg")).thenReturn(new byte[]{5});
        when(imageProcessor.toThumbnail(new byte[]{5})).thenReturn(new byte[]{6});
        when(thumbnailRepository.findById(SPECIMEN)).thenReturn(Optional.of(new SpecimenThumbnail(SPECIMEN)));

        List<PhotoDto> result = service.reorder(SPECIMEN, List.of(2L, 1L));

        assertThat(result).extracting(PhotoDto::id).containsExactly(2L, 1L);
        assertThat(b.getPosition()).isZero();
        assertThat(a.getPosition()).isEqualTo(1);
        verify(thumbnailRepository).save(argThat(t -> Arrays.equals(t.getData(), new byte[]{6})));
    }

    @Test
    void reorder_missingOrDuplicatePhoto_isRejected() {
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN))
                .thenReturn(List.of(photo(1, "a", 0), photo(2, "b", 1)));

        assertThatThrownBy(() -> service.reorder(SPECIMEN, List.of(1L, 1L))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.reorder(SPECIMEN, List.of(1L))).isInstanceOf(BadRequestException.class);
    }

    @Test
    void delete_cover_removesTheFileAndPromotesTheNextPhoto() {
        SpecimenPhoto a = photo(1, "photos/7/a.jpg", 0), b = photo(2, "photos/7/b.jpg", 1);
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of(a, b));
        when(gitHub.download("photos/7/b.jpg")).thenReturn(new byte[]{5});
        when(imageProcessor.toThumbnail(any())).thenReturn(new byte[]{6});
        when(thumbnailRepository.findById(SPECIMEN)).thenReturn(Optional.of(new SpecimenThumbnail(SPECIMEN)));

        service.delete(SPECIMEN, 1L);

        verify(gitHub).commit("Remove a photo from specimen #7", Map.of(), List.of("photos/7/a.jpg", "photos/7/a-small.jpg"));
        verify(photoRepository).delete(a);
        assertThat(b.getPosition()).isZero();
        verify(thumbnailRepository).save(any());
    }

    @Test
    void delete_lastPhoto_removesTheThumbnail() {
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of(photo(1, "photos/7/a.jpg", 0)));

        service.delete(SPECIMEN, 1L);

        verify(thumbnailRepository).deleteById(SPECIMEN);
    }

    @Test
    void deleteAllFiles_gitHubDown_doesNotBlockDeletingTheSpecimen() {
        when(photoRepository.findBySpecimenIdOrderByPositionAscIdAsc(SPECIMEN)).thenReturn(List.of(photo(1, "photos/7/a.jpg", 0)));
        when(gitHub.commit(any(), any(), any())).thenThrow(new GitHubException("offline"));

        service.deleteAllFiles(SPECIMEN); // no exception

        verify(gitHub).commit("Remove the photos of deleted specimen #7", Map.of(), List.of("photos/7/a.jpg", "photos/7/a-small.jpg"));
    }
}
