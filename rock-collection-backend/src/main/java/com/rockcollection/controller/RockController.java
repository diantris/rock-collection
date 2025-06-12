// RockController.java - REST controller for managing collected rocks and related endpoints
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
@CrossOrigin(origins = "http://localhost:3000")
public class RockController {

    @Autowired
    private RockService rockService; // Service for rock-related business logic

    /**
     * Get a paginated list of collected rocks.
     * @param page Page number for pagination (default 0)
     * @return List of rocks as maps
     */
    @GetMapping
    public List<Map<String, Object>> getRocks(@RequestParam(defaultValue = "0") int page) {
        List<Map<String, Object>> rocks = rockService.getRocks(page);
        // Add ID to each map for frontend use
        for (Map<String, Object> rock : rocks) {
            if (rock.get("id") == null && rock.containsKey("_id")) {
                rock.put("id", rock.get("_id"));
            }
        }
        return rocks;
    }

    /**
     * Get details for a specific rock by ID.
     * @param id Rock ID
     * @return Rock details as a map
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRockById(@PathVariable Long id) {
        ResponseEntity<Map<String, Object>> response = rockService.getRockById(id);
        if (response.getBody() != null && !response.getBody().containsKey("id")) {
            Map<String, Object> body = response.getBody();
            body.put("id", id);
        }
        return response;
    }

    /**
     * Create a new collected rock entry.
     * @param rock CollectedRock object
     * @return Created CollectedRock
     */
    @PostMapping
    public ResponseEntity<CollectedRock> createRock(@Valid @RequestBody CollectedRock rock) {
        return rockService.createRock(rock);
    }

    /**
     * Update an existing collected rock entry.
     * @param id Rock ID
     * @param rock Updated CollectedRock object
     * @return Updated CollectedRock
     */
    @PutMapping("/{id}")
    public ResponseEntity<CollectedRock> updateRock(@PathVariable Long id, @Valid @RequestBody CollectedRock rock) {
        return rockService.updateRock(id, rock);
    }

    /**
     * Delete a collected rock entry by ID.
     * @param id Rock ID
     * @return Void response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRock(@PathVariable Long id) {
        return rockService.deleteRock(id);
    }
}
// End of RockController.java
