package com.tabia.service;

import com.tabia.dto.CreateSessionRequest;
import com.tabia.dto.SessionResponse;
import com.tabia.exception.ResourceNotFoundException;
import com.tabia.exception.UnauthorizedException;
import com.tabia.model.Session;
import com.tabia.model.User;
import com.tabia.repository.CollaboratorRepository;
import com.tabia.repository.SessionRepository;
import com.tabia.repository.TabRepository;
import com.tabia.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SessionService
 */
@ExtendWith(MockitoExtension.class)
class SessionServiceTest {
    
    @Mock
    private SessionRepository sessionRepository;
    
    @Mock
    private TabRepository tabRepository;
    
    @Mock
    private CollaboratorRepository collaboratorRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private SessionService sessionService;
    
    private String userId;
    private UUID sessionId;
    private Session testSession;
    private User testUser;
    
    @BeforeEach
    void setUp() {
        userId = "test-user-123";
        sessionId = UUID.randomUUID();
        
        testUser = new User(userId, "test@example.com", "Test User", "photo.jpg");
        testSession = new Session(userId, "Test Session", false);
        testSession.setId(sessionId);
        testSession.setCreatedAt(LocalDateTime.now());
        testSession.setUpdatedAt(LocalDateTime.now());
    }
    
    @Test
    void createSession_ShouldCreateSessionWithTabs() {
        // Given
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("New Session");
        request.setIsWindowSession(false);
        request.setTabs(new ArrayList<>());
        
        when(sessionRepository.save(any(Session.class))).thenReturn(testSession);
        when(tabRepository.saveAll(any())).thenReturn(new ArrayList<>());
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        
        // When
        SessionResponse response = sessionService.createSession(userId, request);
        
        // Then
        assertNotNull(response);
        assertEquals(testSession.getId(), response.getId());
        assertEquals(testSession.getName(), response.getName());
        assertTrue(response.getOwner());
        
        verify(sessionRepository).save(any(Session.class));
        verify(tabRepository).saveAll(any());
    }
    
    @Test
    void getAllUserSessions_ShouldReturnUserSessions() {
        // Given
        List<Session> sessions = List.of(testSession);
        when(sessionRepository.findAllUserSessions(userId)).thenReturn(sessions);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        
        // When
        List<SessionResponse> response = sessionService.getAllUserSessions(userId);
        
        // Then
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(testSession.getId(), response.get(0).getId());
        
        verify(sessionRepository).findAllUserSessions(userId);
    }
    
    @Test
    void getSessionById_ShouldReturnSession_WhenUserHasAccess() {
        // Given
        when(sessionRepository.findByIdAndUserHasAccess(sessionId, userId))
            .thenReturn(Optional.of(testSession));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        
        // When
        SessionResponse response = sessionService.getSessionById(userId, sessionId);
        
        // Then
        assertNotNull(response);
        assertEquals(sessionId, response.getId());
        
        verify(sessionRepository).findByIdAndUserHasAccess(sessionId, userId);
    }
    
    @Test
    void getSessionById_ShouldThrowException_WhenSessionNotFound() {
        // Given
        when(sessionRepository.findByIdAndUserHasAccess(sessionId, userId))
            .thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(ResourceNotFoundException.class, 
            () -> sessionService.getSessionById(userId, sessionId));
        
        verify(sessionRepository).findByIdAndUserHasAccess(sessionId, userId);
    }
    
    @Test
    void deleteSession_ShouldDeleteSession_WhenUserIsOwner() {
        // Given
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(testSession));
        
        // When
        sessionService.deleteSession(userId, sessionId);
        
        // Then
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository).delete(testSession);
    }
    
    @Test
    void deleteSession_ShouldThrowException_WhenUserNotOwner() {
        // Given
        String otherUserId = "other-user-123";
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(testSession));
        
        // When & Then
        assertThrows(UnauthorizedException.class, 
            () -> sessionService.deleteSession(otherUserId, sessionId));
        
        verify(sessionRepository).findById(sessionId);
        verify(sessionRepository, never()).delete(any());
    }
}