package com.rockcollection.config;

import com.rockcollection.controller.RandomRockWebSocketController;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration for registering handlers and endpoints.
 */
@Configuration
@EnableWebSocket
@Slf4j
public class WebSocketConfig implements WebSocketConfigurer {
    @Autowired
    private RandomRockWebSocketController handler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        log.info("Registering WebSocket handler for random rocks at /api/random-rocks/ws");
        registry.addHandler(handler, "/api/random-rocks/ws").setAllowedOrigins("*");
    }
}

