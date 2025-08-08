package com.tabia.controller;

import com.tabia.config.FirebaseAuthenticationToken;
import com.tabia.dto.AddTabRequest;
import com.tabia.dto.TabResponse;
import com.tabia.dto.UpdateTabRequest;
import com.tabia.service.TabService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for tab management within sessions
 * Handles tab CRUD operations with role-based access control
 */
@RestController
@RequestMapping("/api/tabs")
public class TabController {
    
    private static final Logger logger = LoggerFactory.getLogger(TabController.class);
    
    private final TabService tabService;
    
    public TabController(TabService tabService) {
        this.tabService = tabService;
    }
    
    /**
     * Add a new tab to a session
     * POST /api/tabs/{sessionId}
     */
    @PostMapping("/{sessionId}")
    public ResponseEntity<TabResponse> addTab(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @Valid @RequestBody AddTabRequest request) {
        
        String userId = getUserId(authentication);
        TabResponse response = tabService.addTab(userId, sessionId, request);
        
        logger.info("Added tab '{}' to session {} by user: {}", 
                   request.getTitle(), sessionId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Update an existing tab
     * PUT /api/tabs/{tabId}
     */
    @PutMapping("/{tabId}")
    public ResponseEntity<TabResponse> updateTab(
            Authentication authentication,
            @PathVariable UUID tabId,
            @Valid @RequestBody UpdateTabRequest request) {
        
        String userId = getUserId(authentication);
        TabResponse response = tabService.updateTab(userId, tabId, request);
        
        logger.info("Updated tab {} by user: {}", tabId, userId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a tab from a session
     * DELETE /api/tabs/{tabId}
     */
    @DeleteMapping("/{tabId}")
    public ResponseEntity<Void> deleteTab(
            Authentication authentication,
            @PathVariable UUID tabId) {
        
        String userId = getUserId(authentication);
        tabService.deleteTab(userId, tabId);
        
        logger.info("Deleted tab {} by user: {}", tabId, userId);
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