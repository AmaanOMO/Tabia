package com.tabia.dto.websocket;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * WebSocket message for user presence in sessions
 * Shows who is currently viewing/editing a session
 */
public class UserPresenceMessage {
    
    public enum PresenceType {
        USER_JOINED,
        USER_LEFT,
        PRESENCE_UPDATE
    }
    
    private PresenceType type;
    private UUID sessionId;
    private String userId;
    private String userName;
    private String userEmail;
    private List<UserInfo> activeUsers;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    // Nested class for user information
    public static class UserInfo {
        private String userId;
        private String userName;
        private String userEmail;
        private LocalDateTime joinedAt;
        
        public UserInfo() {}
        
        public UserInfo(String userId, String userName, String userEmail, LocalDateTime joinedAt) {
            this.userId = userId;
            this.userName = userName;
            this.userEmail = userEmail;
            this.joinedAt = joinedAt;
        }
        
        // Getters and Setters
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
        
        public LocalDateTime getJoinedAt() {
            return joinedAt;
        }
        
        public void setJoinedAt(LocalDateTime joinedAt) {
            this.joinedAt = joinedAt;
        }
    }
    
    // Constructors
    public UserPresenceMessage() {
        this.timestamp = LocalDateTime.now();
    }
    
    public UserPresenceMessage(PresenceType type, UUID sessionId, String userId, String userName, String userEmail) {
        this();
        this.type = type;
        this.sessionId = sessionId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
    }
    
    // Getters and Setters
    public PresenceType getType() {
        return type;
    }
    
    public void setType(PresenceType type) {
        this.type = type;
    }
    
    public UUID getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
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
    
    public List<UserInfo> getActiveUsers() {
        return activeUsers;
    }
    
    public void setActiveUsers(List<UserInfo> activeUsers) {
        this.activeUsers = activeUsers;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
