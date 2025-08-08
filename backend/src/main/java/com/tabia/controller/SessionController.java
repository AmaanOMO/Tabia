package com.tabia.controller;

import com.tabia.config.FirebaseAuthenticationToken;
import com.tabia.dto.CreateSessionRequest;
import com.tabia.dto.SessionResponse;
import com.tabia.dto.UpdateSessionRequest;
import com.tabia.service.SessionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for session management
 * Handles session CRUD operations with Firebase authentication
 */
@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    
    private static final Logger logger = LoggerFactory.getLogger(SessionController.class);
    
    private final SessionService sessionService;
    
    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }
    
    /**
     * Create a new session with tabs
     * POST /api/sessions
     */
    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            Authentication authentication,
            @Valid @RequestBody CreateSessionRequest request) {
        
        String userId = getUserId(authentication);
        SessionResponse response = sessionService.createSession(userId, request);
        
        logger.info("Created session '{}' for user: {}", request.getName(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get all sessions for the authenticated user (owned + shared)
     * GET /api/sessions
     */
    @GetMapping
    public ResponseEntity<List<SessionResponse>> getAllSessions(Authentication authentication) {
        String userId = getUserId(authentication);
        List<SessionResponse> sessions = sessionService.getAllUserSessions(userId);
        
        logger.debug("Retrieved {} sessions for user: {}", sessions.size(), userId);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Get a specific session by ID
     * GET /api/sessions/{sessionId}
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(
            Authentication authentication,
            @PathVariable UUID sessionId) {
        
        String userId = getUserId(authentication);
        SessionResponse session = sessionService.getSessionById(userId, sessionId);
        
        return ResponseEntity.ok(session);
    }
    
    /**
     * Update session properties (rename, star/unstar)
     * PATCH /api/sessions/{sessionId}
     */
    @PatchMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> updateSession(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @Valid @RequestBody UpdateSessionRequest request) {
        
        String userId = getUserId(authentication);
        SessionResponse response = sessionService.updateSession(userId, sessionId, request);
        
        logger.info("Updated session {} for user: {}", sessionId, userId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a session (owner only)
     * DELETE /api/sessions/{sessionId}
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            Authentication authentication,
            @PathVariable UUID sessionId) {
        
        String userId = getUserId(authentication);
        sessionService.deleteSession(userId, sessionId);
        
        logger.info("Deleted session {} by user: {}", sessionId, userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Extract user ID from Firebase authentication token
     */
    private String getUserId(Authentication authentication) {
        if (authentication instanceof FirebaseAuthenticationToken) {
            return ((FirebaseAuthenticationToken) authentication).getUid();
        }
        throw new IllegalStateException("Invalid authentication type");
    }
}