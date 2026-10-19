package com.rockcollection.specimen;

import com.rockcollection.common.NotFoundException;
import com.rockcollection.common.PageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer tests: request binding, validation and error mapping (service is mocked). */
@WebMvcTest(SpecimenController.class)
class SpecimenControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SpecimenService specimenService;

    @Test
    void getPage_parsesLowercaseDirectionAndReturnsPageShape() throws Exception {
        when(specimenService.findPage(1, 10, "name", Sort.Direction.DESC))
                .thenReturn(new PageResponse<>(List.of(), 1, 10, 0, 0));

        mockMvc.perform(get("/api/specimens").param("page", "1").param("size", "10")
                        .param("sort", "name").param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void create_withOnlyName_isAccepted() throws Exception {
        mockMvc.perform(post("/api/specimens").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Piasek Pustyni\"}"))
                .andExpect(status().isCreated());
        verify(specimenService).create(any());
    }

    @Test
    void changes_withoutTheAppHeader_areRefused() throws Exception {
        // What a form on another web site could send through the owner's browser
        mockMvc.perform(post("/api/specimens").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("X-Rock-Collection")));
        mockMvc.perform(delete("/api/specimens/1")).andExpect(status().isForbidden());
        verifyNoInteractions(specimenService);
        // Reading needs no header
        when(specimenService.findPage(anyInt(), anyInt(), any(), any())).thenReturn(new PageResponse<>(List.of(), 0, 25, 0, 0));
        mockMvc.perform(get("/api/specimens")).andExpect(status().isOk());
    }

    @Test
    void create_withoutName_returnsFieldErrors() throws Exception {
        mockMvc.perform(post("/api/specimens").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" \",\"acquiredMonth\":13}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").value("name is required"))
                .andExpect(jsonPath("$.acquiredMonth").exists());
        verifyNoInteractions(specimenService);
    }

    @Test
    void create_withUnknownEnumValue_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/specimens").header("X-Rock-Collection", "1").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"form\":\"PEBBLE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getById_missing_returns404() throws Exception {
        when(specimenService.findById(7L)).thenThrow(new NotFoundException("Specimen", 7L));

        mockMvc.perform(get("/api/specimens/7"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Specimen 7 not found"));
    }
}
