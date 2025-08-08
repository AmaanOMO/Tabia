package com.tabia.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Collaborator entity representing users who have access to sessions
 * Maps to the 'collaborator' table in PostgreSQL
 */
@Entity
@Table(name = "collaborator")
@EntityListeners(AuditingEntityListener.class)
public class Collaborator {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
    
    @Column(name = "user_id", nullable = false)
    private String userId; // References User.uid
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private CollaboratorRole role; // "editor" or "viewer"
    
    @CreatedDate
    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private Session session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    // Constructors
    public Collaborator() {}
    
    public Collaborator(UUID sessionId, String userId, CollaboratorRole role) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.role = role;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public CollaboratorRole getRole() {
        return role;
    }
    
    public void setRole(CollaboratorRole role) {
        this.role = role;
    }
    
    public LocalDateTime getAddedAt() {
        return addedAt;
    }
    
    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }
    
    public Session getSession() {
        return session;
    }
    
    public void setSession(Session session) {
        this.session = session;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    // Enum for collaborator roles
    public enum CollaboratorRole {
        EDITOR, VIEWER
    }
}