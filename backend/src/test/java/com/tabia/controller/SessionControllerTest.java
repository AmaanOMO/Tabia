package com.tabia.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tabia.config.FirebaseAuthenticationToken;
import com.tabia.dto.CreateSessionRequest;
import com.tabia.dto.SessionResponse;
import com.tabia.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for SessionController
 */
@WebMvcTest(SessionController.class)
class SessionControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private SessionService sessionService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private String userId;
    private FirebaseAuthenticationToken authToken;
    private SessionResponse testSessionResponse;
    
    @BeforeEach
    void setUp() {
        userId = "test-user-123";
        authToken = new FirebaseAuthenticationToken(
            userId, "test@example.com", "Test User", "photo.jpg",
            List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        
        testSessionResponse = new SessionResponse(
            UUID.randomUUID(), "Test Session", userId, "Test User", "test@example.com",
            false, false, true, LocalDateTime.now(), LocalDateTime.now()
        );
    }
    
    @Test
    void createSession_ShouldReturnCreatedSession() throws Exception {
        // Given
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName("New Session");
        request.setIsWindowSession(false);
        request.setTabs(new ArrayList<>());
        
        when(sessionService.createSession(eq(userId), any(CreateSessionRequest.class)))
            .thenReturn(testSessionResponse);
        
        // When & Then
        mockMvc.perform(post("/api/sessions")
                .with(authentication(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(testSessionResponse.getId().toString()))
                .andExpect(jsonPath("$.name").value(testSessionResponse.getName()))
                .andExpect(jsonPath("$.owner").value(true));
    }
    
    @Test
    void getAllSessions_ShouldReturnSessionsList() throws Exception {
        // Given
        List<SessionResponse> sessions = List.of(testSessionResponse);
        when(sessionService.getAllUserSessions(userId)).thenReturn(sessions);
        
        // When & Then
        mockMvc.perform(get("/api/sessions")
                .with(authentication(authToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(testSessionResponse.getId().toString()))
                .andExpect(jsonPath("$[0].name").value(testSessionResponse.getName()));
    }
    
    @Test
    void getSession_ShouldReturnSession() throws Exception {
        // Given
        UUID sessionId = testSessionResponse.getId();
        when(sessionService.getSessionById(userId, sessionId)).thenReturn(testSessionResponse);
        
        // When & Then
        mockMvc.perform(get("/api/sessions/{sessionId}", sessionId)
                .with(authentication(authToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId.toString()))
                .andExpect(jsonPath("$.name").value(testSessionResponse.getName()));
    }
    
    @Test
    void deleteSession_ShouldReturnNoContent() throws Exception {
        // Given
        UUID sessionId = testSessionResponse.getId();
        
        // When & Then
        mockMvc.perform(delete("/api/sessions/{sessionId}", sessionId)
                .with(authentication(authToken)))
                .andExpect(status().isNoContent());
    }
    
    @Test
    void createSession_ShouldReturnBadRequest_WhenNameIsBlank() throws Exception {
        // Given
        CreateSessionRequest request = new CreateSessionRequest();
        request.setName(""); // Invalid: blank name
        request.setIsWindowSession(false);
        request.setTabs(new ArrayList<>());
        
        // When & Then
        mockMvc.perform(post("/api/sessions")
                .with(authentication(authToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}