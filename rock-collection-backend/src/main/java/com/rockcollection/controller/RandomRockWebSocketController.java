package com.rockcollection.controller;

import com.rockcollection.service.RandomRockWebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;

/**
 * WebSocket handler for registering websocket connections for random rock updates.
 */
@Component
public class RandomRockWebSocketController extends TextWebSocketHandler {
    @Autowired
    private RandomRockWebSocketService randomRockWebSocketService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        randomRockWebSocketService.registerSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        randomRockWebSocketService.unregisterSession(session);
    }
}
