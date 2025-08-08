package com.tabia.service;

import com.tabia.dto.AddTabRequest;
import com.tabia.dto.TabResponse;
import com.tabia.dto.UpdateTabRequest;
import com.tabia.exception.ResourceNotFoundException;
import com.tabia.exception.UnauthorizedException;
import com.tabia.model.Collaborator;
import com.tabia.model.Tab;
import com.tabia.repository.TabRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for tab management operations
 * Handles tab creation, updates, deletion with role-based access control
 */
@Service
@Transactional
public class TabService {
    
    private static final Logger logger = LoggerFactory.getLogger(TabService.class);
    
    private final TabRepository tabRepository;
    private final SessionService sessionService;
    
    public TabService(TabRepository tabRepository, SessionService sessionService) {
        this.tabRepository = tabRepository;
        this.sessionService = sessionService;
    }
    
    /**
     * Add a new tab to a session
     * Only editors can add tabs
     */
    public TabResponse addTab(String userId, UUID sessionId, AddTabRequest request) {
        // Check if user has editor access to session
        Optional<Collaborator.CollaboratorRole> userRole = sessionService.getUserRoleForSession(userId, sessionId);
        if (userRole.isEmpty() || userRole.get() != Collaborator.CollaboratorRole.EDITOR) {
            throw new UnauthorizedException("Only editors can add tabs to sessions");
        }
        
        // Determine tab position if not provided
        Integer tabIndex = request.getTabIndex();
        if (tabIndex == null) {
            // Add at the end of the window
            Integer maxIndex = tabRepository.findMaxTabIndexForWindow(sessionId, request.getWindowIndex());
            tabIndex = maxIndex + 1;
        }
        
        // Create the tab
        Tab tab = new Tab(
            sessionId,
            request.getTitle(),
            request.getUrl(),
            tabIndex,
            request.getWindowIndex()
        );
        
        Tab savedTab = tabRepository.save(tab);
        
        logger.info("Added tab '{}' to session {} by user: {}", 
                   request.getTitle(), sessionId, userId);
        
        return convertToTabResponse(savedTab);
    }
    
    /**
     * Update an existing tab
     * Only editors can update tabs
     */
    public TabResponse updateTab(String userId, UUID tabId, UpdateTabRequest request) {
        Tab tab = tabRepository.findByIdAndUserHasAccess(tabId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Tab not found or access denied"));
        
        // Check if user has editor access
        Optional<Collaborator.CollaboratorRole> userRole = sessionService.getUserRoleForSession(userId, tab.getSessionId());
        if (userRole.isEmpty() || userRole.get() != Collaborator.CollaboratorRole.EDITOR) {
            throw new UnauthorizedException("Only editors can update tabs");
        }
        
        // Update properties if provided
        if (request.getTitle() != null) {
            tab.setTitle(request.getTitle());
        }
        if (request.getUrl() != null) {
            tab.setUrl(request.getUrl());
        }
        if (request.getTabIndex() != null) {
            tab.setTabIndex(request.getTabIndex());
        }
        if (request.getWindowIndex() != null) {
            tab.setWindowIndex(request.getWindowIndex());
        }
        
        Tab updatedTab = tabRepository.save(tab);
        
        logger.info("Updated tab {} in session {} by user: {}", 
                   tabId, tab.getSessionId(), userId);
        
        return convertToTabResponse(updatedTab);
    }
    
    /**
     * Delete a tab from a session
     * Only editors can delete tabs
     */
    public void deleteTab(String userId, UUID tabId) {
        Tab tab = tabRepository.findByIdAndUserHasAccess(tabId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Tab not found or access denied"));
        
        // Check if user has editor access
        Optional<Collaborator.CollaboratorRole> userRole = sessionService.getUserRoleForSession(userId, tab.getSessionId());
        if (userRole.isEmpty() || userRole.get() != Collaborator.CollaboratorRole.EDITOR) {
            throw new UnauthorizedException("Only editors can delete tabs");
        }
        
        tabRepository.delete(tab);
        
        logger.info("Deleted tab {} from session {} by user: {}", 
                   tabId, tab.getSessionId(), userId);
    }
    
    /**
     * Convert Tab entity to TabResponse DTO
     */
    private TabResponse convertToTabResponse(Tab tab) {
        return new TabResponse(
            tab.getId(),
            tab.getSessionId(),
            tab.getTitle(),
            tab.getUrl(),
            tab.getTabIndex(),
            tab.getWindowIndex(),
            tab.getCreatedAt()
        );
    }
}