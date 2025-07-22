package com.rockcollection.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service for generating random rock counts and broadcasting to registered websockets.
 */
@Service
public class RandomRockWebSocketService {
    // Thread-safe set of registered websocket sessions
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    /**
     * Register a websocket session.
     * @param session WebSocketSession to register
     */
    public void registerSession(WebSocketSession session) {
        sessions.add(session);
    }

    /**
     * Unregister a websocket session.
     * @param session WebSocketSession to unregister
     */
    public void unregisterSession(WebSocketSession session) {
        sessions.remove(session);
    }

    /**
     * Scheduled task to generate and broadcast a random integer every 15 seconds.
     */
    @Scheduled(fixedRate = 15000)
    public void generateAndBroadcast() {
        int random = ThreadLocalRandom.current().nextInt(50, 201);
        String json = String.format("{\"rocks\":%d}", random);
        broadcast(json);
    }

    /**
     * Broadcast a message to all registered websocket sessions.
     * @param message JSON message to send
     */
    private void broadcast(String message) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    // Remove closed/broken sessions
                    unregisterSession(session);
                }
            } else {
                unregisterSession(session);
            }
        }
    }
}
