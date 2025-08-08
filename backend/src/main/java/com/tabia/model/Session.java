package com.tabia.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Session entity representing browsing sessions
 * Maps to the 'session' table in PostgreSQL
 */
@Entity
@Table(name = "session")
@EntityListeners(AuditingEntityListener.class)
public class Session {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "owner_id", nullable = false)
    private String ownerId; // References User.uid
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "is_starred", nullable = false)
    private Boolean isStarred = false;
    
    @Column(name = "is_window_session", nullable = false)
    private Boolean isWindowSession = false; // true for "window" type, false for "tab" type
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    private User owner;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Tab> tabs;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Collaborator> collaborators;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Invite> invites;
    
    // Constructors
    public Session() {}
    
    public Session(String ownerId, String name, Boolean isWindowSession) {
        this.ownerId = ownerId;
        this.name = name;
        this.isWindowSession = isWindowSession;
        this.isStarred = false;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getOwnerId() {
        return ownerId;
    }
    
    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
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
    
    public User getOwner() {
        return owner;
    }
    
    public void setOwner(User owner) {
        this.owner = owner;
    }
    
    public List<Tab> getTabs() {
        return tabs;
    }
    
    public void setTabs(List<Tab> tabs) {
        this.tabs = tabs;
    }
    
    public List<Collaborator> getCollaborators() {
        return collaborators;
    }
    
    public void setCollaborators(List<Collaborator> collaborators) {
        this.collaborators = collaborators;
    }
    
    public List<Invite> getInvites() {
        return invites;
    }
    
    public void setInvites(List<Invite> invites) {
        this.invites = invites;
    }
}