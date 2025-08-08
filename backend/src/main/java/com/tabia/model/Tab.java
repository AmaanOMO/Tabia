package com.tabia.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tab entity representing individual browser tabs within sessions
 * Maps to the 'tab' table in PostgreSQL
 */
@Entity
@Table(name = "tab")
@EntityListeners(AuditingEntityListener.class)
public class Tab {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "url", nullable = false)
    private String url;
    
    @Column(name = "tab_index", nullable = false)
    private Integer tabIndex; // Position of tab within the session
    
    @Column(name = "window_index", nullable = false)
    private Integer windowIndex; // Which window this tab belongs to (for multi-window sessions)
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private Session session;
    
    // Constructors
    public Tab() {}
    
    public Tab(UUID sessionId, String title, String url, Integer tabIndex, Integer windowIndex) {
        this.sessionId = sessionId;
        this.title = title;
        this.url = url;
        this.tabIndex = tabIndex;
        this.windowIndex = windowIndex;
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
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public Integer getTabIndex() {
        return tabIndex;
    }
    
    public void setTabIndex(Integer tabIndex) {
        this.tabIndex = tabIndex;
    }
    
    public Integer getWindowIndex() {
        return windowIndex;
    }
    
    public void setWindowIndex(Integer windowIndex) {
        this.windowIndex = windowIndex;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Session getSession() {
        return session;
    }
    
    public void setSession(Session session) {
        this.session = session;
    }
}