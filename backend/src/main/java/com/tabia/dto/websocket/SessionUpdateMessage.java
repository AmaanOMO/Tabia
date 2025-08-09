package com.tabia.dto.websocket;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tabia.dto.TabResponse;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WebSocket message for session-level updates
 * Broadcast to all users with access to the session
 */
public class SessionUpdateMessage {
    
    public enum UpdateType {
        SESSION_RENAMED,
        SESSION_STARRED,
        SESSION_UNSTARRED,
        SESSION_DELETED,
        USER_JOINED_SESSION,
        USER_LEFT_SESSION
    }
    
    private UpdateType type;
    private UUID sessionId;
    private String sessionName;
    private String userId;
    private String userName;
    private String userEmail;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    // Constructors
    public SessionUpdateMessage() {
        this.timestamp = LocalDateTime.now();
    }
    
    public SessionUpdateMessage(UpdateType type, UUID sessionId, String userId) {
        this();
        this.type = type;
        this.sessionId = sessionId;
        this.userId = userId;
    }
    
    public SessionUpdateMessage(UpdateType type, UUID sessionId, String sessionName, String userId, String userName, String userEmail) {
        this();
        this.type = type;
        this.sessionId = sessionId;
        this.sessionName = sessionName;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
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
    
    public String getSessionName() {
        return sessionName;
    }
    
    public void setSessionName(String sessionName) {
        this.sessionName = sessionName;
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
    
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
