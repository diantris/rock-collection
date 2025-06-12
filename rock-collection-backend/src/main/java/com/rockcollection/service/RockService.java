// RockService.java - Service layer for rock-related business logic
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
    private RockRepository rockRepository; // Repository for rock data access

    /**
     * Get details for a specific rock by ID.
     * @param id Rock ID
     * @return ResponseEntity with rock details or NOT_FOUND
     */
    public ResponseEntity<Map<String, Object>> getRockById(Long id) {
        return rockRepository.fetchRockById(id)
                .map(rock -> ResponseEntity.ok(rock))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Get a paginated list of rocks.
     * @param page Page number
     * @return List of rocks as maps
     */
    public List<Map<String, Object>> getRocks(int page) {
        return rockRepository.fetchRocks(page);
    }

    /**
     * Create a new collected rock.
     * @param rock CollectedRock object
     * @return ResponseEntity with created rock
     */
    public ResponseEntity<CollectedRock> createRock(CollectedRock rock) {
        CollectedRock created = rockRepository.createRock(rock);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing collected rock.
     * @param id Rock ID
     * @param rock Updated CollectedRock object
     * @return ResponseEntity with updated rock or NOT_FOUND
     */
    public ResponseEntity<CollectedRock> updateRock(Long id, CollectedRock rock) {
        return rockRepository.updateRock(id, rock)
                .map(updated -> ResponseEntity.ok(updated))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Delete a collected rock by ID.
     * @param id Rock ID
     * @return ResponseEntity with no content or NOT_FOUND
     */
    public ResponseEntity<Void> deleteRock(Long id) {
        boolean deleted = rockRepository.deleteRock(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
// End of RockService.java
