package com.tabia.dto;

import com.tabia.model.Collaborator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for invite response data
 */
public class InviteResponse {
    
    private UUID id;
    private UUID sessionId;
    private String sessionName;
    private String inviteCode;
    private Collaborator.CollaboratorRole role;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Boolean used;
    
    // Constructors
    public InviteResponse() {}
    
    public InviteResponse(UUID id, UUID sessionId, String sessionName, String inviteCode, 
                         Collaborator.CollaboratorRole role, String createdBy, String createdByName,
                         LocalDateTime createdAt, LocalDateTime expiresAt, Boolean used) {
        this.id = id;
        this.sessionId = sessionId;
        this.sessionName = sessionName;
        this.inviteCode = inviteCode;
        this.role = role;
        this.createdBy = createdBy;
        this.createdByName = createdByName;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.used = used;
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
    
    public String getSessionName() {
        return sessionName;
    }
    
    public void setSessionName(String sessionName) {
        this.sessionName = sessionName;
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
    
    public String getCreatedByName() {
        return createdByName;
    }
    
    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
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
}