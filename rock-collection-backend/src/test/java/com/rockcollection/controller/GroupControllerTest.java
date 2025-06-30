package com.rockcollection.controller;

import com.rockcollection.model.RockGroupProperties;
import com.rockcollection.repository.RockGroupPropertiesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GroupControllerTest {
    @Mock
    private RockGroupPropertiesRepository repository;

    @InjectMocks
    private GroupController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getAllGroups_returnsList() {
        List<RockGroupProperties> groups = List.of(new RockGroupProperties());
        when(repository.findAll()).thenReturn(groups);
        assertEquals(groups, controller.getAllGroups());
    }

    @Test
    void getGroupById_found() {
        RockGroupProperties group = new RockGroupProperties();
        when(repository.findById(1L)).thenReturn(Optional.of(group));
        ResponseEntity<RockGroupProperties> response = controller.getGroupById(1L);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(group, response.getBody());
    }

    @Test
    void getGroupById_notFound() {
        when(repository.findById(2L)).thenReturn(Optional.empty());
        ResponseEntity<RockGroupProperties> response = controller.getGroupById(2L);
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void createGroup_returnsCreated() {
        RockGroupProperties group = new RockGroupProperties();
        when(repository.save(group)).thenReturn(group);
        ResponseEntity<RockGroupProperties> response = controller.createGroup(group);
        assertEquals(201, response.getStatusCode().value());
        assertEquals(group, response.getBody());
    }

    @Test
    void updateGroup_found() {
        RockGroupProperties group = new RockGroupProperties();
        when(repository.findById(1L)).thenReturn(Optional.of(group));
        when(repository.save(group)).thenReturn(group);
        ResponseEntity<RockGroupProperties> response = controller.updateGroup(1L, group);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(group, response.getBody());
    }

    @Test
    void updateGroup_notFound() {
        RockGroupProperties group = new RockGroupProperties();
        when(repository.findById(2L)).thenReturn(Optional.empty());
        ResponseEntity<RockGroupProperties> response = controller.updateGroup(2L, group);
        assertEquals(404, response.getStatusCode().value());
    }
}

