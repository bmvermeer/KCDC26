package com.example.chat;

/**
 * Wire format for every message exchanged over the /ws/chat socket.
 * type: "join" | "message" | "leave" (client -> server)
 *       "history" | "message" | "system" | "channels" | "error" (server -> client)
 */
public record ChatMessage(
        String type,
        String channel,
        String username,
        String content,
        Long timestamp,
        java.util.List<ChatMessage> messages,
        java.util.List<String> channels
) {
    public static ChatMessage of(String type, String channel, String username, String content, long timestamp) {
        return new ChatMessage(type, channel, username, content, timestamp, null, null);
    }
}
