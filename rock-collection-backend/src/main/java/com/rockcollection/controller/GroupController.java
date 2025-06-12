package com.rockcollection.controller;

import com.rockcollection.model.RockGroupProperties;
import com.rockcollection.repository.RockGroupPropertiesRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@Validated
public class GroupController {

    @Autowired
    private RockGroupPropertiesRepository rockGroupPropertiesRepository;

    @GetMapping
    public List<RockGroupProperties> getAllGroups() {
        return rockGroupPropertiesRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RockGroupProperties> getGroupById(@PathVariable Long id) {
        return rockGroupPropertiesRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RockGroupProperties> createGroup(@Valid @RequestBody RockGroupProperties group) {
        RockGroupProperties created = rockGroupPropertiesRepository.save(group);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RockGroupProperties> updateGroup(@PathVariable Long id, @Valid @RequestBody RockGroupProperties group) {
        return rockGroupPropertiesRepository.findById(id)
                .map(existing -> {
                    group.setId(id);
                    RockGroupProperties updated = rockGroupPropertiesRepository.save(group);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        if (rockGroupPropertiesRepository.existsById(id)) {
            rockGroupPropertiesRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

