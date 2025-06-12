package com.rockcollection.controller;

import com.rockcollection.model.CollectedRock;
import com.rockcollection.service.RockService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.HttpStatus;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rocks")
@Validated
public class RockController {

    @Autowired
    private RockService rockService;

    // 1. Paginated list endpoint
    @GetMapping
    public List<Map<String, Object>> getRocks(@RequestParam(defaultValue = "0") int page) {
        return rockService.getRocks(page);
    }

    // 2. Details endpoint
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRockById(@PathVariable Long id) {
        return rockService.getRockById(id);
    }

    @PostMapping
    public ResponseEntity<CollectedRock> createRock(@Valid @RequestBody CollectedRock rock) {
        return rockService.createRock(rock);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectedRock> updateRock(@PathVariable Long id, @Valid @RequestBody CollectedRock rock) {
        return rockService.updateRock(id, rock);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRock(@PathVariable Long id) {
        return rockService.deleteRock(id);
    }
}
