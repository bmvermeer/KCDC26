package com.example.chat;

import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Minimal in-memory multi-channel chat hub. No persistence, no auth -
 * every connection picks a username and a channel on "join" and the
 * server fans out plain-text (markdown) messages to everyone else in
 * that channel. Channels are created on demand simply by joining them.
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final int HISTORY_LIMIT = 50;

    private final ObjectMapper mapper;

    private final Map<String, Set<WebSocketSession>> channelSessions = new ConcurrentHashMap<>();
    private final Map<String, ConcurrentLinkedDeque<ChatMessage>> channelHistory = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUsername = new ConcurrentHashMap<>();
    private final Map<String, String> sessionChannel = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        ChatMessage incoming = mapper.readValue(message.getPayload(), ChatMessage.class);

        switch (incoming.type()) {
            case "join" -> handleJoin(session, incoming);
            case "message" -> handleMessage(session, incoming);
            case "leave" -> handleLeave(session);
            default -> sendTo(session, ChatMessage.of("error", null, null, "Unknown message type", now()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        handleLeave(session);
    }

    private void handleJoin(WebSocketSession session, ChatMessage incoming) throws IOException {
        String channel = normalizeChannel(incoming.channel());
        String username = normalizeUsername(incoming.username());
        if (channel == null || username == null) {
            sendTo(session, ChatMessage.of("error", null, null, "channel and username are required", now()));
            return;
        }

        // Leave any previous channel first (a session belongs to one channel at a time).
        handleLeave(session);

        sessionUsername.put(session.getId(), username);
        sessionChannel.put(session.getId(), channel);
        channelSessions.computeIfAbsent(channel, c -> ConcurrentHashMap.newKeySet()).add(session);
        channelHistory.computeIfAbsent(channel, c -> new ConcurrentLinkedDeque<>());

        sendTo(session, new ChatMessage("history", channel, null, null, now(),
                List.copyOf(channelHistory.get(channel)), null));

        broadcast(channel, ChatMessage.of("system", channel, username, username + " joined " + channel, now()), null);
        broadcastChannelList();
    }

    private void handleMessage(WebSocketSession session, ChatMessage incoming) throws IOException {
        String channel = sessionChannel.get(session.getId());
        String username = sessionUsername.get(session.getId());
        if (channel == null || username == null || incoming.content() == null || incoming.content().isBlank()) {
            return;
        }

        ChatMessage outgoing = ChatMessage.of("message", channel, username, incoming.content(), now());
        recordHistory(channel, outgoing);
        broadcast(channel, outgoing, null);
    }

    private void handleLeave(WebSocketSession session) {
        String channel = sessionChannel.remove(session.getId());
        String username = sessionUsername.remove(session.getId());
        if (channel == null) {
            return;
        }
        Set<WebSocketSession> sessions = channelSessions.get(channel);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                channelSessions.remove(channel);
                channelHistory.remove(channel);
            } else if (username != null) {
                broadcast(channel, ChatMessage.of("system", channel, username, username + " left " + channel, now()), session);
            }
        }
        broadcastChannelList();
    }

    private void recordHistory(String channel, ChatMessage message) {
        ConcurrentLinkedDeque<ChatMessage> history = channelHistory.computeIfAbsent(channel, c -> new ConcurrentLinkedDeque<>());
        history.addLast(message);
        while (history.size() > HISTORY_LIMIT) {
            history.pollFirst();
        }
    }

    private void broadcast(String channel, ChatMessage message, WebSocketSession exclude) {
        Set<WebSocketSession> sessions = channelSessions.get(channel);
        if (sessions == null) {
            return;
        }
        for (WebSocketSession s : sessions) {
            if (s.equals(exclude)) {
                continue;
            }
            sendTo(s, message);
        }
    }

    private void broadcastChannelList() {
        ChatMessage listMessage = new ChatMessage("channels", null, null, null, now(), null, List.copyOf(channelSessions.keySet()));
        for (Set<WebSocketSession> sessions : channelSessions.values()) {
            for (WebSocketSession s : sessions) {
                sendTo(s, listMessage);
            }
        }
    }

    private void sendTo(WebSocketSession session, ChatMessage message) {
        if (!session.isOpen()) {
            return;
        }
        try {
            session.sendMessage(new TextMessage(mapper.writeValueAsString(message)));
        } catch (IOException e) {
            // Session likely closed mid-broadcast; nothing else to do.
        }
    }

    private String normalizeChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return null;
        }
        return channel.trim().toLowerCase().replaceAll("\\s+", "-");
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            return null;
        }
        return username.trim();
    }

    private long now() {
        return System.currentTimeMillis();
    }
}
