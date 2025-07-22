package com.rockcollection.controller;

import com.rockcollection.service.RandomRockWebSocketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;

/**
 * WebSocket handler for registering websocket connections for random rock updates.
 */
@Component
@Slf4j
public class RandomRockWebSocketHandler extends TextWebSocketHandler {
    @Autowired
    private RandomRockWebSocketService randomRockWebSocketService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established: {}", session.getId());
        randomRockWebSocketService.registerSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {} with status {}", session.getId(), status);
        randomRockWebSocketService.unregisterSession(session);
    }
}

