package com.rockcollection.publish;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.EnumSet;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublishController.class)
class PublishControllerTest {
    @Autowired
    private MockMvc mvc;
    @MockitoBean
    private PublishService publishService;

    @Test
    void updateSettings_acceptsFieldNames() throws Exception {
        mvc.perform(put("/api/publish/settings").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fields\": [\"HARDNESS\", \"STREAK\"], \"intro\": \"Hi\", \"messageUrl\": \"https://script.google.com/macros/s/abc/exec\"}"))
                .andExpect(status().isOk());

        verify(publishService).updateSettings(new PublishDto.SettingsRequest(EnumSet.of(PublishField.HARDNESS, PublishField.STREAK), "Hi",
                "https://script.google.com/macros/s/abc/exec"));
    }

    @Test
    void updateSettings_messageBoxAddressMustBeHttpsOrEmpty() throws Exception {
        for (String url : new String[] {"http://example.com/exec", "javascript:alert(1)", "https://a b"}) {
            mvc.perform(put("/api/publish/settings").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"fields\": [], \"messageUrl\": \"" + url + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.messageUrl").value("messageUrl must be an https:// address"));
        }
        mvc.perform(put("/api/publish/settings").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fields\": [], \"messageUrl\": \"\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void updateSettings_unknownFieldOrMissingList_is400() throws Exception {
        mvc.perform(put("/api/publish/settings").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON).content("{\"fields\": [\"PRIVATE_NOTES\"]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/publish/settings").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON).content("{\"intro\": \"Hi\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields").value("fields is required"));
    }

    @Test
    void publish_returnsTheResult() throws Exception {
        when(publishService.publish()).thenReturn(new PublishDto.Result(true, 3, "https://owner.github.io/pages/", Instant.EPOCH));

        mvc.perform(post("/api/publish").header("X-Rock-Collection", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changed").value(true))
                .andExpect(jsonPath("$.specimenCount").value(3));
    }
}
