package com.tabia.dto;

import com.tabia.model.Collaborator;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for collaborator response data
 */
public class CollaboratorResponse {
    
    private UUID id;
    private String userId;
    private String userName;
    private String userEmail;
    private String userPhotoUrl;
    private Collaborator.CollaboratorRole role;
    private LocalDateTime addedAt;
    
    // Constructors
    public CollaboratorResponse() {}
    
    public CollaboratorResponse(UUID id, String userId, String userName, String userEmail, 
                               String userPhotoUrl, Collaborator.CollaboratorRole role, 
                               LocalDateTime addedAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.userPhotoUrl = userPhotoUrl;
        this.role = role;
        this.addedAt = addedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getUserName() {
        return userName;
    }
    
    public void setUserName(String userName) {
        this.userName = userName;
    }
    
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
    
    public String getUserPhotoUrl() {
        return userPhotoUrl;
    }
    
    public void setUserPhotoUrl(String userPhotoUrl) {
        this.userPhotoUrl = userPhotoUrl;
    }
    
    public Collaborator.CollaboratorRole getRole() {
        return role;
    }
    
    public void setRole(Collaborator.CollaboratorRole role) {
        this.role = role;
    }
    
    public LocalDateTime getAddedAt() {
        return addedAt;
    }
    
    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }
}