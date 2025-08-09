package com.tabia.config;

import com.tabia.service.UserPresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket event listener for handling connection lifecycle
 * Manages user presence when users connect/disconnect
 */
@Component
public class WebSocketEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    
    private final UserPresenceService userPresenceService;
    
    public WebSocketEventListener(UserPresenceService userPresenceService) {
        this.userPresenceService = userPresenceService;
    }
    
    /**
     * Handle WebSocket connection established
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        if (headerAccessor.getUser() instanceof FirebaseAuthenticationToken) {
            FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) headerAccessor.getUser();
            logger.debug("WebSocket connection established for user: {} (session: {})", 
                        auth.getName(), sessionId);
        } else {
            logger.debug("WebSocket connection established for unauthenticated user (session: {})", sessionId);
        }
    }
    
    /**
     * Handle WebSocket disconnection
     * Remove user from all session presence tracking
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        if (headerAccessor.getUser() instanceof FirebaseAuthenticationToken) {
            FirebaseAuthenticationToken auth = (FirebaseAuthenticationToken) headerAccessor.getUser();
            
            // Remove user from all sessions they were present in
            userPresenceService.removeUserFromAllSessions(auth.getUid());
            
            logger.debug("WebSocket disconnected for user: {} (session: {})", 
                        auth.getName(), sessionId);
        } else {
            logger.debug("WebSocket disconnected for unauthenticated user (session: {})", sessionId);
        }
    }
}
