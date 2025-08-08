package com.tabia.dto;

import com.tabia.model.Collaborator;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for creating a session invite
 */
public class CreateInviteRequest {
    
    @NotNull(message = "Role is required")
    private Collaborator.CollaboratorRole role;
    
    private Integer expiresInHours = 24; // Default to 24 hours
    
    // Constructors
    public CreateInviteRequest() {}
    
    public CreateInviteRequest(Collaborator.CollaboratorRole role, Integer expiresInHours) {
        this.role = role;
        this.expiresInHours = expiresInHours;
    }
    
    // Getters and Setters
    public Collaborator.CollaboratorRole getRole() {
        return role;
    }
    
    public void setRole(Collaborator.CollaboratorRole role) {
        this.role = role;
    }
    
    public Integer getExpiresInHours() {
        return expiresInHours;
    }
    
    public void setExpiresInHours(Integer expiresInHours) {
        this.expiresInHours = expiresInHours;
    }
}