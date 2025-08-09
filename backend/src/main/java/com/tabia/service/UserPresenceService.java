package com.tabia.service;

import com.tabia.dto.websocket.UserPresenceMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for tracking user presence in sessions
 * Manages who is currently viewing/editing each session
 */
@Service
public class UserPresenceService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserPresenceService.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    
    // Map of sessionId -> Map of userId -> UserPresenceInfo
    private final Map<UUID, Map<String, UserPresenceInfo>> sessionPresence = new ConcurrentHashMap<>();
    
    public UserPresenceService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * User information for presence tracking
     */
    public static class UserPresenceInfo {
        private final String userId;
        private final String userName;
        private final String userEmail;
        private final LocalDateTime joinedAt;
        private LocalDateTime lastSeen;
        
        public UserPresenceInfo(String userId, String userName, String userEmail) {
            this.userId = userId;
            this.userName = userName;
            this.userEmail = userEmail;
            this.joinedAt = LocalDateTime.now();
            this.lastSeen = LocalDateTime.now();
        }
        
        // Getters
        public String getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getUserEmail() { return userEmail; }
        public LocalDateTime getJoinedAt() { return joinedAt; }
        public LocalDateTime getLastSeen() { return lastSeen; }
        
        public void updateLastSeen() {
            this.lastSeen = LocalDateTime.now();
        }
    }
    
    /**
     * Add user to session presence
     */
    public void joinSession(UUID sessionId, String userId, String userName, String userEmail) {
        sessionPresence.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>())
                     .put(userId, new UserPresenceInfo(userId, userName, userEmail));
        
        logger.debug("User {} joined session {}", userName, sessionId);
        
        // Broadcast user joined message
        UserPresenceMessage message = new UserPresenceMessage(
            UserPresenceMessage.PresenceType.USER_JOINED,
            sessionId, userId, userName, userEmail
        );
        message.setActiveUsers(getActiveUsersForSession(sessionId));
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/presence", message);
    }
    
    /**
     * Remove user from session presence
     */
    public void leaveSession(UUID sessionId, String userId) {
        Map<String, UserPresenceInfo> sessionUsers = sessionPresence.get(sessionId);
        if (sessionUsers == null) {
            return;
        }
        
        UserPresenceInfo userInfo = sessionUsers.remove(userId);
        if (userInfo == null) {
            return;
        }
        
        // Clean up empty session maps
        if (sessionUsers.isEmpty()) {
            sessionPresence.remove(sessionId);
        }
        
        logger.debug("User {} left session {}", userInfo.getUserName(), sessionId);
        
        // Broadcast user left message
        UserPresenceMessage message = new UserPresenceMessage(
            UserPresenceMessage.PresenceType.USER_LEFT,
            sessionId, userId, userInfo.getUserName(), userInfo.getUserEmail()
        );
        message.setActiveUsers(getActiveUsersForSession(sessionId));
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/presence", message);
    }
    
    /**
     * Update user's last seen timestamp
     */
    public void updateUserActivity(UUID sessionId, String userId) {
        Map<String, UserPresenceInfo> sessionUsers = sessionPresence.get(sessionId);
        if (sessionUsers != null) {
            UserPresenceInfo userInfo = sessionUsers.get(userId);
            if (userInfo != null) {
                userInfo.updateLastSeen();
            }
        }
    }
    
    /**
     * Get list of active users for a session
     */
    public List<UserPresenceMessage.UserInfo> getActiveUsersForSession(UUID sessionId) {
        Map<String, UserPresenceInfo> sessionUsers = sessionPresence.get(sessionId);
        if (sessionUsers == null) {
            return List.of();
        }
        
        return sessionUsers.values().stream()
                .map(info -> new UserPresenceMessage.UserInfo(
                    info.getUserId(),
                    info.getUserName(),
                    info.getUserEmail(),
                    info.getJoinedAt()
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * Check if user is currently in session
     */
    public boolean isUserInSession(UUID sessionId, String userId) {
        Map<String, UserPresenceInfo> sessionUsers = sessionPresence.get(sessionId);
        return sessionUsers != null && sessionUsers.containsKey(userId);
    }
    
    /**
     * Get count of active users in session
     */
    public int getActiveUserCount(UUID sessionId) {
        Map<String, UserPresenceInfo> sessionUsers = sessionPresence.get(sessionId);
        return sessionUsers != null ? sessionUsers.size() : 0;
    }
    
    /**
     * Remove all users from a session (when session is deleted)
     */
    public void clearSessionPresence(UUID sessionId) {
        sessionPresence.remove(sessionId);
        logger.debug("Cleared presence for session {}", sessionId);
    }
    
    /**
     * Remove user from all sessions (when user disconnects)
     */
    public void removeUserFromAllSessions(String userId) {
        sessionPresence.forEach((sessionId, users) -> {
            if (users.remove(userId) != null) {
                logger.debug("Removed user {} from session {} due to disconnect", userId, sessionId);
                
                // Broadcast user left message
                UserPresenceMessage message = new UserPresenceMessage(
                    UserPresenceMessage.PresenceType.USER_LEFT,
                    sessionId, userId, "", ""
                );
                message.setActiveUsers(getActiveUsersForSession(sessionId));
                
                messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/presence", message);
            }
        });
        
        // Clean up empty session maps
        sessionPresence.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
}
