package com.rockcollection.controller;

import com.rockcollection.service.RockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RockControllerTest {
    @Mock
    private RockService rockService;

    @InjectMocks
    private RockController rockController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getRocks_returnsListOfRocks() {
        List<Map<String, Object>> mockRocks = new ArrayList<>();
        Map<String, Object> rock = new HashMap<>();
        rock.put("id", 1L);
        rock.put("name", "Granite");
        mockRocks.add(rock);
        when(rockService.getRocks(0)).thenReturn(mockRocks);

        List<Map<String, Object>> result = rockController.getRocks(0);
        assertEquals(1, result.size());
        assertEquals("Granite", result.get(0).get("name"));
    }

    @Test
    void getRockById_returnsRockDetails() {
        Map<String, Object> rockDetails = new HashMap<>();
        rockDetails.put("id", 1L);
        ResponseEntity<Map<String, Object>> responseEntity = ResponseEntity.ok(rockDetails);
        when(rockService.getRockById(1L)).thenReturn(responseEntity);

        ResponseEntity<Map<String, Object>> response = rockController.getRockById(1L);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(1L, response.getBody().get("id"));
    }

    @Test
    void getRockById_returnsNotFound() {
        ResponseEntity<Map<String, Object>> notFound = ResponseEntity.status(404).build();
        when(rockService.getRockById(2L)).thenReturn(notFound);
        ResponseEntity<Map<String, Object>> response = rockController.getRockById(2L);
        assertEquals(404, response.getStatusCode().value());
    }
}
