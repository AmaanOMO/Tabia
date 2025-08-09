package com.tabia.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.tabia.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * WebSocket authentication interceptor
 * Verifies Firebase JWT tokens for WebSocket connections
 */
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);
    
    private final UserService userService;
    
    public WebSocketAuthChannelInterceptor(UserService userService) {
        this.userService = userService;
    }

    /**
     * Intercept WebSocket messages before they are sent to message handlers
     * Authenticates users on CONNECT and validates tokens on subsequent messages
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Authenticate user on WebSocket connection
            authenticateUser(accessor);
        }
        
        return message;
    }
    
    /**
     * Authenticate user using Firebase JWT token from WebSocket headers
     */
    private void authenticateUser(StompHeaderAccessor accessor) {
        try {
            // Extract Authorization header from WebSocket connection
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            
            if (authHeaders == null || authHeaders.isEmpty()) {
                logger.warn("WebSocket connection attempted without Authorization header");
                return;
            }
            
            String authHeader = authHeaders.get(0);
            if (!authHeader.startsWith("Bearer ")) {
                logger.warn("WebSocket connection attempted with invalid Authorization header format");
                return;
            }
            
            // Extract and verify Firebase JWT token
            String idToken = authHeader.substring(7);
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();
            String name = decodedToken.getName();
            
            logger.debug("WebSocket authentication successful for user: {} ({})", name, uid);
            
            // Ensure user exists in database
            userService.createOrUpdateUser(uid, email, name);
            
            // Create authentication token and set in WebSocket session
            FirebaseAuthenticationToken authentication = new FirebaseAuthenticationToken(uid, email, name);
            accessor.setUser(authentication);
            
        } catch (Exception e) {
            logger.error("WebSocket authentication failed: {}", e.getMessage());
            // Don't set user - connection will be unauthenticated
        }
    }
}
