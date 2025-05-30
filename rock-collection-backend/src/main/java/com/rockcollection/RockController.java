package com.rockcollection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rocks")
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
}

