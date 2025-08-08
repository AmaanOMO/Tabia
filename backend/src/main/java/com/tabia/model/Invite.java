package com.tabia.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Invite entity representing session invitations
 * Maps to the 'invite' table in PostgreSQL
 */
@Entity
@Table(name = "invite")
@EntityListeners(AuditingEntityListener.class)
public class Invite {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
    
    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode; // Unique code for accepting invites
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Collaborator.CollaboratorRole role; // Role to assign when invite is accepted
    
    @Column(name = "created_by", nullable = false)
    private String createdBy; // User ID who created the invite
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "used", nullable = false)
    private Boolean used = false;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private Session session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    private User creator;
    
    // Constructors
    public Invite() {}
    
    public Invite(UUID sessionId, String inviteCode, Collaborator.CollaboratorRole role, 
                  String createdBy, LocalDateTime expiresAt) {
        this.sessionId = sessionId;
        this.inviteCode = inviteCode;
        this.role = role;
        this.createdBy = createdBy;
        this.expiresAt = expiresAt;
        this.used = false;
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
    
    public String getInviteCode() {
        return inviteCode;
    }
    
    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }
    
    public Collaborator.CollaboratorRole getRole() {
        return role;
    }
    
    public void setRole(Collaborator.CollaboratorRole role) {
        this.role = role;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Boolean getUsed() {
        return used;
    }
    
    public void setUsed(Boolean used) {
        this.used = used;
    }
    
    public Session getSession() {
        return session;
    }
    
    public void setSession(Session session) {
        this.session = session;
    }
    
    public User getCreator() {
        return creator;
    }
    
    public void setCreator(User creator) {
        this.creator = creator;
    }
}