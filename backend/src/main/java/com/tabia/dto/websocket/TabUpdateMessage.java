package com.tabia.dto.websocket;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tabia.dto.TabResponse;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WebSocket message for tab-level updates
 * Broadcast to all users with access to the session
 */
public class TabUpdateMessage {
    
    public enum UpdateType {
        TAB_ADDED,
        TAB_REMOVED,
        TAB_UPDATED,
        TAB_REORDERED
    }
    
    private UpdateType type;
    private UUID sessionId;
    private TabResponse tab;
    private String userId;
    private String userName;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    // Constructors
    public TabUpdateMessage() {
        this.timestamp = LocalDateTime.now();
    }
    
    public TabUpdateMessage(UpdateType type, UUID sessionId, TabResponse tab, String userId, String userName) {
        this();
        this.type = type;
        this.sessionId = sessionId;
        this.tab = tab;
        this.userId = userId;
        this.userName = userName;
    }
    
    // Getters and Setters
    public UpdateType getType() {
        return type;
    }
    
    public void setType(UpdateType type) {
        this.type = type;
    }
    
    public UUID getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }
    
    public TabResponse getTab() {
        return tab;
    }
    
    public void setTab(TabResponse tab) {
        this.tab = tab;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
