package com.rockcollection.service;

import com.rockcollection.repository.RockRepository;
import com.rockcollection.model.CollectedRock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class RockService {

    @Autowired
    private RockRepository rockRepository;

    public ResponseEntity<Map<String, Object>> getRockById(Long id) {
        return rockRepository.fetchRockById(id)
                .map(rock -> ResponseEntity.ok(rock))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public List<Map<String, Object>> getRocks(int page) {
        return rockRepository.fetchRocks(page);
    }

    public ResponseEntity<CollectedRock> createRock(CollectedRock rock) {
        CollectedRock created = rockRepository.createRock(rock);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    public ResponseEntity<CollectedRock> updateRock(Long id, CollectedRock rock) {
        return rockRepository.updateRock(id, rock)
                .map(updated -> ResponseEntity.ok(updated))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<Void> deleteRock(Long id) {
        boolean deleted = rockRepository.deleteRock(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
