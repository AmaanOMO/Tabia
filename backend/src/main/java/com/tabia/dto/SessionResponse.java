package com.tabia.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for session response data
 */
public class SessionResponse {
    
    private UUID id;
    private String name;
    private String ownerId;
    private String ownerName;
    private String ownerEmail;
    private Boolean isStarred;
    private Boolean isWindowSession;
    private Boolean owner; // true if current user is the owner
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TabResponse> tabs;
    private Integer collaboratorCount;
    
    // Constructors
    public SessionResponse() {}
    
    public SessionResponse(UUID id, String name, String ownerId, String ownerName, 
                          String ownerEmail, Boolean isStarred, Boolean isWindowSession, 
                          Boolean owner, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.isStarred = isStarred;
        this.isWindowSession = isWindowSession;
        this.owner = owner;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getOwnerId() {
        return ownerId;
    }
    
    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }
    
    public String getOwnerName() {
        return ownerName;
    }
    
    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }
    
    public String getOwnerEmail() {
        return ownerEmail;
    }
    
    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }
    
    public Boolean getIsStarred() {
        return isStarred;
    }
    
    public void setIsStarred(Boolean isStarred) {
        this.isStarred = isStarred;
    }
    
    public Boolean getIsWindowSession() {
        return isWindowSession;
    }
    
    public void setIsWindowSession(Boolean isWindowSession) {
        this.isWindowSession = isWindowSession;
    }
    
    public Boolean getOwner() {
        return owner;
    }
    
    public void setOwner(Boolean owner) {
        this.owner = owner;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<TabResponse> getTabs() {
        return tabs;
    }
    
    public void setTabs(List<TabResponse> tabs) {
        this.tabs = tabs;
    }
    
    public Integer getCollaboratorCount() {
        return collaboratorCount;
    }
    
    public void setCollaboratorCount(Integer collaboratorCount) {
        this.collaboratorCount = collaboratorCount;
    }
}