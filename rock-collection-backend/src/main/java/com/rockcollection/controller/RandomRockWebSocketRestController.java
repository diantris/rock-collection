package com.rockcollection.controller;

import com.rockcollection.service.RandomRockWebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for random rock WebSocket registration (placeholder for demonstration).
 */
@RestController
@RequestMapping("/api/random-rocks")
public class RandomRockWebSocketRestController {
    @Autowired
    private RandomRockWebSocketService randomRockWebSocketService;

    /**
     * This endpoint is not supported. WebSocket sessions should only be registered in the WebSocket handler.
     */
    @PostMapping("/register")
    public ResponseEntity<String> registerWebSocket(@RequestParam String sessionId) {
        return ResponseEntity.badRequest().body("WebSocket sessions can only be registered via WebSocket connection, not via REST endpoint.");
    }
}
