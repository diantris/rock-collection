package com.rockcollection.photo;

import com.rockcollection.github.GitHubException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PhotoController.class)
class PhotoControllerTest {
    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private PhotoService photoService;

    @Test
    void upload_returnsAllPhotos() throws Exception {
        when(photoService.upload(eq(7L), anyList())).thenReturn(List.of(
                new PhotoDto(1L, "photos/7/7-abc.jpg", "https://raw.test/photos/7/7-abc.jpg", null, 0, 1600, 1200)));

        mvc.perform(multipart("/api/specimens/7/photos")
                        .file(new MockMultipartFile("files", "a.jpg", "image/jpeg", new byte[]{1}))
                        .file(new MockMultipartFile("files", "b.jpg", "image/jpeg", new byte[]{2})))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].url").value("https://raw.test/photos/7/7-abc.jpg"))
                .andExpect(jsonPath("$[0].width").value(1600));
    }

    @Test
    void upload_withoutGitHub_is503WithMessage() throws Exception {
        when(photoService.upload(eq(7L), anyList())).thenThrow(new GitHubException("GITHUB_TOKEN is missing"));

        mvc.perform(multipart("/api/specimens/7/photos").file(new MockMultipartFile("files", "a.jpg", "image/jpeg", new byte[]{1})))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("GITHUB_TOKEN is missing"));
    }

    @Test
    void thumbnail_versionedUrl_isCacheable() throws Exception {
        SpecimenThumbnail thumbnail = new SpecimenThumbnail(7L);
        thumbnail.replace("image/jpeg", new byte[]{1, 2, 3});
        when(photoService.thumbnail(7L)).thenReturn(thumbnail);

        mvc.perform(get("/api/specimens/7/thumbnail").param("v", "123"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(content().bytes(new byte[]{1, 2, 3}))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("immutable")));
    }

    @Test
    void thumbnail_unversionedUrl_isRevalidated() throws Exception {
        SpecimenThumbnail thumbnail = new SpecimenThumbnail(7L);
        thumbnail.replace("image/jpeg", new byte[]{1});
        when(photoService.thumbnail(7L)).thenReturn(thumbnail);

        mvc.perform(get("/api/specimens/7/thumbnail"))
                .andExpect(header().string("Cache-Control", "no-cache"));
    }
}
