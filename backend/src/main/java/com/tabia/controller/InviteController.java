package com.tabia.controller;

import com.tabia.config.FirebaseAuthenticationToken;
import com.tabia.dto.CollaboratorResponse;
import com.tabia.dto.CreateInviteRequest;
import com.tabia.dto.InviteResponse;
import com.tabia.service.InviteService;
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
 * REST controller for invitation and collaboration management
 * Handles creating invites, accepting invites, and managing collaborators
 */
@RestController
@RequestMapping("/api")
public class InviteController {
    
    private static final Logger logger = LoggerFactory.getLogger(InviteController.class);
    
    private final InviteService inviteService;
    
    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }
    
    /**
     * Create an invite for a session
     * POST /api/invite/{sessionId}
     */
    @PostMapping("/invite/{sessionId}")
    public ResponseEntity<InviteResponse> createInvite(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @Valid @RequestBody CreateInviteRequest request) {
        
        String userId = getUserId(authentication);
        InviteResponse response = inviteService.createInvite(userId, sessionId, request);
        
        logger.info("Created invite for session {} by user: {}", sessionId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Accept an invite using invite code
     * POST /api/invite/accept/{inviteCode}
     */
    @PostMapping("/invite/accept/{inviteCode}")
    public ResponseEntity<Void> acceptInvite(
            Authentication authentication,
            @PathVariable String inviteCode) {
        
        String userId = getUserId(authentication);
        inviteService.acceptInvite(userId, inviteCode);
        
        logger.info("User {} accepted invite: {}", userId, inviteCode);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get all collaborators for a session
     * GET /api/sessions/{sessionId}/collaborators
     */
    @GetMapping("/sessions/{sessionId}/collaborators")
    public ResponseEntity<List<CollaboratorResponse>> getSessionCollaborators(
            Authentication authentication,
            @PathVariable UUID sessionId) {
        
        String userId = getUserId(authentication);
        List<CollaboratorResponse> collaborators = inviteService.getSessionCollaborators(userId, sessionId);
        
        logger.debug("Retrieved {} collaborators for session {} by user: {}", 
                    collaborators.size(), sessionId, userId);
        return ResponseEntity.ok(collaborators);
    }
    
    /**
     * Remove a collaborator from a session
     * DELETE /api/sessions/{sessionId}/collaborators/{collaboratorUserId}
     */
    @DeleteMapping("/sessions/{sessionId}/collaborators/{collaboratorUserId}")
    public ResponseEntity<Void> removeCollaborator(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @PathVariable String collaboratorUserId) {
        
        String userId = getUserId(authentication);
        inviteService.removeCollaborator(userId, sessionId, collaboratorUserId);
        
        logger.info("Removed collaborator {} from session {} by user: {}", 
                   collaboratorUserId, sessionId, userId);
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