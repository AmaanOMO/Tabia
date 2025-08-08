package com.tabia.service;

import com.tabia.dto.*;
import com.tabia.exception.ResourceNotFoundException;
import com.tabia.exception.UnauthorizedException;
import com.tabia.model.Collaborator;
import com.tabia.model.Session;
import com.tabia.model.Tab;
import com.tabia.model.User;
import com.tabia.repository.CollaboratorRepository;
import com.tabia.repository.SessionRepository;
import com.tabia.repository.TabRepository;
import com.tabia.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for session management operations
 * Handles session creation, retrieval, updates, and access control
 */
@Service
@Transactional
public class SessionService {
    
    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);
    
    private final SessionRepository sessionRepository;
    private final TabRepository tabRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final UserRepository userRepository;
    
    public SessionService(SessionRepository sessionRepository, TabRepository tabRepository,
                         CollaboratorRepository collaboratorRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.tabRepository = tabRepository;
        this.collaboratorRepository = collaboratorRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new session with tabs
     */
    public SessionResponse createSession(String userId, CreateSessionRequest request) {
        // Create the session
        Session session = new Session(userId, request.getName(), request.getIsWindowSession());
        Session savedSession = sessionRepository.save(session);
        
        // Create tabs for the session
        List<Tab> tabs = request.getTabs().stream()
            .map(tabDto -> new Tab(
                savedSession.getId(),
                tabDto.getTitle(),
                tabDto.getUrl(),
                tabDto.getTabIndex(),
                tabDto.getWindowIndex()
            ))
            .collect(Collectors.toList());
        
        List<Tab> savedTabs = tabRepository.saveAll(tabs);
        
        logger.info("Created session '{}' with {} tabs for user: {}", 
                   request.getName(), savedTabs.size(), userId);
        
        return convertToSessionResponse(savedSession, userId);
    }
    
    /**
     * Get all sessions for a user (owned + shared)
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getAllUserSessions(String userId) {
        List<Session> sessions = sessionRepository.findAllUserSessions(userId);
        
        return sessions.stream()
            .map(session -> convertToSessionResponse(session, userId))
            .collect(Collectors.toList());
    }
    
    /**
     * Get a specific session by ID (with access control)
     */
    @Transactional(readOnly = true)
    public SessionResponse getSessionById(String userId, UUID sessionId) {
        Session session = sessionRepository.findByIdAndUserHasAccess(sessionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found or access denied"));
        
        return convertToSessionResponse(session, userId);
    }
    
    /**
     * Update session properties (rename, star/unstar)
     * Only owner can modify session properties
     */
    public SessionResponse updateSession(String userId, UUID sessionId, UpdateSessionRequest request) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        // Only owner can update session properties
        if (!session.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only session owner can update session properties");
        }
        
        // Update properties if provided
        if (request.getName() != null) {
            session.setName(request.getName());
        }
        if (request.getIsStarred() != null) {
            session.setIsStarred(request.getIsStarred());
        }
        
        Session updatedSession = sessionRepository.save(session);
        
        logger.info("Updated session {} for user: {}", sessionId, userId);
        return convertToSessionResponse(updatedSession, userId);
    }
    
    /**
     * Delete a session (owner only)
     * Cascading delete will handle tabs, collaborators, and invites
     */
    public void deleteSession(String userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        // Only owner can delete session
        if (!session.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only session owner can delete session");
        }
        
        sessionRepository.delete(session);
        
        logger.info("Deleted session {} by user: {}", sessionId, userId);
    }
    
    /**
     * Check if user has access to session and return their role
     */
    @Transactional(readOnly = true)
    public Optional<Collaborator.CollaboratorRole> getUserRoleForSession(String userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            return Optional.empty();
        }
        
        // Owner has full access (treated as EDITOR)
        if (session.getOwnerId().equals(userId)) {
            return Optional.of(Collaborator.CollaboratorRole.EDITOR);
        }
        
        // Check if user is a collaborator
        return collaboratorRepository.findRoleBySessionIdAndUserId(sessionId, userId);
    }
    
    /**
     * Convert Session entity to SessionResponse DTO
     */
    private SessionResponse convertToSessionResponse(Session session, String currentUserId) {
        User owner = userRepository.findById(session.getOwnerId()).orElse(null);
        
        SessionResponse response = new SessionResponse(
            session.getId(),
            session.getName(),
            session.getOwnerId(),
            owner != null ? owner.getName() : null,
            owner != null ? owner.getEmail() : null,
            session.getIsStarred(),
            session.getIsWindowSession(),
            session.getOwnerId().equals(currentUserId), // owner flag
            session.getCreatedAt(),
            session.getUpdatedAt()
        );
        
        // Add tabs if loaded
        if (session.getTabs() != null) {
            List<TabResponse> tabResponses = session.getTabs().stream()
                .map(this::convertToTabResponse)
                .collect(Collectors.toList());
            response.setTabs(tabResponses);
        }
        
        // Add collaborator count
        if (session.getCollaborators() != null) {
            response.setCollaboratorCount(session.getCollaborators().size());
        }
        
        return response;
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