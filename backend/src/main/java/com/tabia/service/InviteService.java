package com.tabia.service;

import com.tabia.dto.CollaboratorResponse;
import com.tabia.dto.CreateInviteRequest;
import com.tabia.dto.InviteResponse;
import com.tabia.exception.BadRequestException;
import com.tabia.exception.ResourceNotFoundException;
import com.tabia.exception.UnauthorizedException;
import com.tabia.model.Collaborator;
import com.tabia.model.Invite;
import com.tabia.model.Session;
import com.tabia.model.User;
import com.tabia.repository.CollaboratorRepository;
import com.tabia.repository.InviteRepository;
import com.tabia.repository.SessionRepository;
import com.tabia.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for invitation and collaboration management
 * Handles creating invites, accepting invites, and managing collaborators
 */
@Service
@Transactional
public class InviteService {
    
    private static final Logger logger = LoggerFactory.getLogger(InviteService.class);
    
    private final InviteRepository inviteRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    
    public InviteService(InviteRepository inviteRepository, CollaboratorRepository collaboratorRepository,
                        SessionRepository sessionRepository, UserRepository userRepository) {
        this.inviteRepository = inviteRepository;
        this.collaboratorRepository = collaboratorRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Create an invite for a session
     * Only session owner can create invites
     */
    public InviteResponse createInvite(String userId, UUID sessionId, CreateInviteRequest request) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        // Only owner can create invites
        if (!session.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only session owner can create invites");
        }
        
        // Generate unique invite code
        String inviteCode = generateUniqueInviteCode();
        
        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(request.getExpiresInHours());
        
        // Create the invite
        Invite invite = new Invite(sessionId, inviteCode, request.getRole(), userId, expiresAt);
        Invite savedInvite = inviteRepository.save(invite);
        
        logger.info("Created invite {} for session {} by user: {}", 
                   inviteCode, sessionId, userId);
        
        return convertToInviteResponse(savedInvite);
    }
    
    /**
     * Accept an invite using invite code
     * User must be authenticated to accept
     */
    public void acceptInvite(String userId, String inviteCode) {
        Invite invite = inviteRepository.findValidInviteByCode(inviteCode, LocalDateTime.now())
            .orElseThrow(() -> new BadRequestException("Invalid or expired invite code"));
        
        // Check if user is already a collaborator
        boolean isAlreadyCollaborator = collaboratorRepository.existsBySessionIdAndUserId(
            invite.getSessionId(), userId);
        
        if (isAlreadyCollaborator) {
            throw new BadRequestException("User is already a collaborator on this session");
        }
        
        // Check if user is the session owner
        sessionRepository.findById(invite.getSessionId())
            .ifPresent(session -> {
                if (session.getOwnerId().equals(userId)) {
                    throw new BadRequestException("Session owner cannot accept invite to their own session");
                }
            });
        
        // Create collaborator entry
        Collaborator collaborator = new Collaborator(invite.getSessionId(), userId, invite.getRole());
        collaboratorRepository.save(collaborator);
        
        // Mark invite as used
        invite.setUsed(true);
        inviteRepository.save(invite);
        
        logger.info("User {} accepted invite {} for session {}", 
                   userId, inviteCode, invite.getSessionId());
    }
    
    /**
     * Get all collaborators for a session
     * Only users with access to the session can view collaborators
     */
    @Transactional(readOnly = true)
    public List<CollaboratorResponse> getSessionCollaborators(String userId, UUID sessionId) {
        // Check if user has access to session (throws exception if no access)
        sessionRepository.findByIdAndUserHasAccess(sessionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found or access denied"));
        
        List<Collaborator> collaborators = collaboratorRepository.findBySessionIdOrderByAddedAtDesc(sessionId);
        
        return collaborators.stream()
            .map(this::convertToCollaboratorResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Remove a collaborator from a session
     * Only session owner can remove collaborators
     */
    public void removeCollaborator(String userId, UUID sessionId, String collaboratorUserId) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        
        // Only owner can remove collaborators
        if (!session.getOwnerId().equals(userId)) {
            throw new UnauthorizedException("Only session owner can remove collaborators");
        }
        
        // Cannot remove the owner
        if (collaboratorUserId.equals(session.getOwnerId())) {
            throw new BadRequestException("Cannot remove session owner as collaborator");
        }
        
        collaboratorRepository.deleteBySessionIdAndUserId(sessionId, collaboratorUserId);
        
        logger.info("Removed collaborator {} from session {} by owner: {}", 
                   collaboratorUserId, sessionId, userId);
    }
    
    /**
     * Generate a unique invite code
     */
    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (inviteRepository.existsByInviteCode(inviteCode));
        
        return inviteCode;
    }
    
    /**
     * Convert Invite entity to InviteResponse DTO
     */
    private InviteResponse convertToInviteResponse(Invite invite) {
        Session session = sessionRepository.findById(invite.getSessionId()).orElse(null);
        User creator = userRepository.findById(invite.getCreatedBy()).orElse(null);
        
        return new InviteResponse(
            invite.getId(),
            invite.getSessionId(),
            session != null ? session.getName() : null,
            invite.getInviteCode(),
            invite.getRole(),
            invite.getCreatedBy(),
            creator != null ? creator.getName() : null,
            invite.getCreatedAt(),
            invite.getExpiresAt(),
            invite.getUsed()
        );
    }
    
    /**
     * Convert Collaborator entity to CollaboratorResponse DTO
     */
    private CollaboratorResponse convertToCollaboratorResponse(Collaborator collaborator) {
        User user = userRepository.findById(collaborator.getUserId()).orElse(null);
        
        return new CollaboratorResponse(
            collaborator.getId(),
            collaborator.getUserId(),
            user != null ? user.getName() : null,
            user != null ? user.getEmail() : null,
            user != null ? user.getPhotoUrl() : null,
            collaborator.getRole(),
            collaborator.getAddedAt()
        );
    }
}