package com.tabia.controller;

import com.tabia.config.FirebaseAuthenticationToken;
import com.tabia.dto.AddTabRequest;
import com.tabia.dto.TabResponse;
import com.tabia.dto.UpdateTabRequest;
import com.tabia.dto.websocket.SessionUpdateMessage;
import com.tabia.dto.websocket.TabUpdateMessage;
import com.tabia.dto.websocket.UserPresenceMessage;
import com.tabia.service.SessionService;
import com.tabia.service.TabService;
import com.tabia.service.UserPresenceService;
import com.tabia.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * WebSocket controller for real-time session collaboration
 * Handles all real-time updates for sessions, tabs, and user presence
 */
@Controller
public class WebSocketSessionController {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketSessionController.class);
    
    private final SessionService sessionService;
    private final TabService tabService;
    private final UserPresenceService userPresenceService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketSessionController(SessionService sessionService, TabService tabService, 
                                    UserPresenceService userPresenceService, UserService userService,
                                    SimpMessagingTemplate messagingTemplate) {
        this.sessionService = sessionService;
        this.tabService = tabService;
        this.userPresenceService = userPresenceService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Handle user subscribing to session updates
     * Automatically adds user to presence tracking
     */
    @SubscribeMapping("/topic/session/{sessionId}")
    public void subscribeToSession(@DestinationVariable String sessionId, Principal principal) {
        if (principal instanceof FirebaseAuthenticationToken) {
            FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) principal;
            UUID sessionUUID = UUID.fromString(sessionId);
            
            // Verify user has access to this session
            try {
                sessionService.getSessionById(auth.getUid(), sessionUUID);
                
                // Add user to presence tracking
                userPresenceService.joinSession(sessionUUID, auth.getUid(), auth.getName(), auth.getEmail());
                
                logger.debug("User {} subscribed to session {}", auth.getName(), sessionId);
            } catch (Exception e) {
                logger.warn("User {} attempted to subscribe to unauthorized session {}", auth.getUid(), sessionId);
            }
        }
    }
    
    /**
     * Add tab to session via WebSocket
     * POST /app/session/{sessionId}/add-tab
     */
    @MessageMapping("/session/{sessionId}/add-tab")
    @SendTo("/topic/session/{sessionId}/tabs")
    public TabUpdateMessage addTab(@DestinationVariable String sessionId, 
                                  AddTabRequest request, 
                                  Principal principal) {
        
        if (!(principal instanceof FirebaseAuthenticationToken)) {
            throw new IllegalStateException("Invalid authentication");
        }
        
        FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) principal;
        UUID sessionUUID = UUID.fromString(sessionId);
        
        try {
            // Add tab through service layer
            TabResponse tab = tabService.addTab(auth.getUid(), sessionUUID, request);
            
            // Update user activity
            userPresenceService.updateUserActivity(sessionUUID, auth.getUid());
            
            logger.info("User {} added tab '{}' to session {} via WebSocket", 
                       auth.getName(), tab.getTitle(), sessionId);
            
            return new TabUpdateMessage(
                TabUpdateMessage.UpdateType.TAB_ADDED,
                sessionUUID, tab, auth.getUid(), auth.getName()
            );
            
        } catch (Exception e) {
            logger.error("Failed to add tab via WebSocket: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Remove tab from session via WebSocket
     * POST /app/session/{sessionId}/remove-tab/{tabId}
     */
    @MessageMapping("/session/{sessionId}/remove-tab/{tabId}")
    @SendTo("/topic/session/{sessionId}/tabs")
    public TabUpdateMessage removeTab(@DestinationVariable String sessionId,
                                     @DestinationVariable String tabId,
                                     Principal principal) {
        
        if (!(principal instanceof FirebaseAuthenticationToken)) {
            throw new IllegalStateException("Invalid authentication");
        }
        
        FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) principal;
        UUID sessionUUID = UUID.fromString(sessionId);
        UUID tabUUID = UUID.fromString(tabId);
        
        try {
            // Get tab info before deletion
            TabResponse tab = tabService.getTabById(auth.getUid(), tabUUID);
            
            // Remove tab through service layer
            tabService.deleteTab(auth.getUid(), tabUUID);
            
            // Update user activity
            userPresenceService.updateUserActivity(sessionUUID, auth.getUid());
            
            logger.info("User {} removed tab '{}' from session {} via WebSocket", 
                       auth.getName(), tab.getTitle(), sessionId);
            
            return new TabUpdateMessage(
                TabUpdateMessage.UpdateType.TAB_REMOVED,
                sessionUUID, tab, auth.getUid(), auth.getName()
            );
            
        } catch (Exception e) {
            logger.error("Failed to remove tab via WebSocket: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Update tab in session via WebSocket
     * POST /app/session/{sessionId}/update-tab/{tabId}
     */
    @MessageMapping("/session/{sessionId}/update-tab/{tabId}")
    @SendTo("/topic/session/{sessionId}/tabs")
    public TabUpdateMessage updateTab(@DestinationVariable String sessionId,
                                     @DestinationVariable String tabId,
                                     UpdateTabRequest request,
                                     Principal principal) {
        
        if (!(principal instanceof FirebaseAuthenticationToken)) {
            throw new IllegalStateException("Invalid authentication");
        }
        
        FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) principal;
        UUID sessionUUID = UUID.fromString(sessionId);
        UUID tabUUID = UUID.fromString(tabId);
        
        try {
            // Update tab through service layer
            TabResponse tab = tabService.updateTab(auth.getUid(), tabUUID, request);
            
            // Update user activity
            userPresenceService.updateUserActivity(sessionUUID, auth.getUid());
            
            logger.info("User {} updated tab '{}' in session {} via WebSocket", 
                       auth.getName(), tab.getTitle(), sessionId);
            
            return new TabUpdateMessage(
                TabUpdateMessage.UpdateType.TAB_UPDATED,
                sessionUUID, tab, auth.getUid(), auth.getName()
            );
            
        } catch (Exception e) {
            logger.error("Failed to update tab via WebSocket: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * Join session for presence tracking
     * POST /app/session/{sessionId}/join
     */
    @MessageMapping("/session/{sessionId}/join")
    public void joinSession(@DestinationVariable String sessionId, Principal principal) {
        if (principal instanceof FirebaseAuthenticationToken) {
            FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) principal;
            UUID sessionUUID = UUID.fromString(sessionId);
            
            try {
                // Verify user has access to session
                sessionService.getSessionById(auth.getUid(), sessionUUID);
                
                // Add to presence tracking
                userPresenceService.joinSession(sessionUUID, auth.getUid(), auth.getName(), auth.getEmail());
                
            } catch (Exception e) {
                logger.warn("User {} failed to join session {}: {}", auth.getUid(), sessionId, e.getMessage());
            }
        }
    }
    
    /**
     * Leave session for presence tracking
     * POST /app/session/{sessionId}/leave
     */
    @MessageMapping("/session/{sessionId}/leave")
    public void leaveSession(@DestinationVariable String sessionId, Principal principal) {
        if (principal instanceof FirebaseAuthenticationToken) {
            FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) principal;
            UUID sessionUUID = UUID.fromString(sessionId);
            
            userPresenceService.leaveSession(sessionUUID, auth.getUid());
        }
    }
    
    /**
     * Broadcast session update to all subscribers
     * Used by other services to notify about session changes
     */
    public void broadcastSessionUpdate(SessionUpdateMessage message) {
        messagingTemplate.convertAndSend("/topic/session/" + message.getSessionId() + "/updates", message);
        logger.debug("Broadcasted session update: {} for session {}", message.getType(), message.getSessionId());
    }
    
    /**
     * Broadcast tab update to all subscribers
     * Used by other services to notify about tab changes
     */
    public void broadcastTabUpdate(TabUpdateMessage message) {
        messagingTemplate.convertAndSend("/topic/session/" + message.getSessionId() + "/tabs", message);
        logger.debug("Broadcasted tab update: {} for session {}", message.getType(), message.getSessionId());
    }
}
