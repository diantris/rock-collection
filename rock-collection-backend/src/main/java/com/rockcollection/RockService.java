package com.rockcollection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.*;
import com.rockcollection.RockRepository;

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
}
