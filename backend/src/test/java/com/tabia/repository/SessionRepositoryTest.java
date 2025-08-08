package com.tabia.repository;

import com.tabia.model.Collaborator;
import com.tabia.model.Session;
import com.tabia.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for SessionRepository
 */
@DataJpaTest
class SessionRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CollaboratorRepository collaboratorRepository;
    
    private User owner;
    private User collaboratorUser;
    private Session session;
    
    @BeforeEach
    void setUp() {
        // Create test users
        owner = new User("owner-123", "owner@example.com", "Owner", "photo1.jpg");
        collaboratorUser = new User("collab-123", "collab@example.com", "Collaborator", "photo2.jpg");
        
        entityManager.persistAndFlush(owner);
        entityManager.persistAndFlush(collaboratorUser);
        
        // Create test session
        session = new Session(owner.getUid(), "Test Session", false);
        entityManager.persistAndFlush(session);
        
        // Add collaborator
        Collaborator collaborator = new Collaborator(session.getId(), 
            collaboratorUser.getUid(), Collaborator.CollaboratorRole.EDITOR);
        entityManager.persistAndFlush(collaborator);
    }
    
    @Test
    void findByOwnerIdOrderByUpdatedAtDesc_ShouldReturnOwnerSessions() {
        // When
        List<Session> sessions = sessionRepository.findByOwnerIdOrderByUpdatedAtDesc(owner.getUid());
        
        // Then
        assertEquals(1, sessions.size());
        assertEquals(session.getId(), sessions.get(0).getId());
        assertEquals(owner.getUid(), sessions.get(0).getOwnerId());
    }
    
    @Test
    void findAllUserSessions_ShouldReturnOwnedAndCollaboratedSessions() {
        // When - Owner should see their own sessions
        List<Session> ownerSessions = sessionRepository.findAllUserSessions(owner.getUid());
        
        // Then
        assertEquals(1, ownerSessions.size());
        assertEquals(session.getId(), ownerSessions.get(0).getId());
        
        // When - Collaborator should see sessions they collaborate on
        List<Session> collaboratorSessions = sessionRepository.findAllUserSessions(collaboratorUser.getUid());
        
        // Then
        assertEquals(1, collaboratorSessions.size());
        assertEquals(session.getId(), collaboratorSessions.get(0).getId());
    }
    
    @Test
    void findByIdAndUserHasAccess_ShouldReturnSession_WhenUserHasAccess() {
        // When - Owner should have access
        Optional<Session> ownerResult = sessionRepository.findByIdAndUserHasAccess(
            session.getId(), owner.getUid());
        
        // Then
        assertTrue(ownerResult.isPresent());
        assertEquals(session.getId(), ownerResult.get().getId());
        
        // When - Collaborator should have access
        Optional<Session> collaboratorResult = sessionRepository.findByIdAndUserHasAccess(
            session.getId(), collaboratorUser.getUid());
        
        // Then
        assertTrue(collaboratorResult.isPresent());
        assertEquals(session.getId(), collaboratorResult.get().getId());
    }
    
    @Test
    void findByIdAndUserHasAccess_ShouldReturnEmpty_WhenUserHasNoAccess() {
        // Given
        User unauthorizedUser = new User("unauth-123", "unauth@example.com", "Unauthorized", "photo3.jpg");
        entityManager.persistAndFlush(unauthorizedUser);
        
        // When
        Optional<Session> result = sessionRepository.findByIdAndUserHasAccess(
            session.getId(), unauthorizedUser.getUid());
        
        // Then
        assertTrue(result.isEmpty());
    }
    
    @Test
    void findStarredSessionsForUser_ShouldReturnOnlyStarredSessions() {
        // Given - Star the session
        session.setIsStarred(true);
        entityManager.persistAndFlush(session);
        
        // Create another non-starred session
        Session nonStarredSession = new Session(owner.getUid(), "Non-Starred Session", false);
        nonStarredSession.setIsStarred(false);
        entityManager.persistAndFlush(nonStarredSession);
        
        // When
        List<Session> starredSessions = sessionRepository.findStarredSessionsForUser(owner.getUid());
        
        // Then
        assertEquals(1, starredSessions.size());
        assertEquals(session.getId(), starredSessions.get(0).getId());
        assertTrue(starredSessions.get(0).getIsStarred());
    }
}