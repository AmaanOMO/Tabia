package com.tabia.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for tab response data
 */
public class TabResponse {
    
    private UUID id;
    private UUID sessionId;
    private String title;
    private String url;
    private Integer tabIndex;
    private Integer windowIndex;
    private LocalDateTime createdAt;
    
    // Constructors
    public TabResponse() {}
    
    public TabResponse(UUID id, UUID sessionId, String title, String url, 
                      Integer tabIndex, Integer windowIndex, LocalDateTime createdAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.title = title;
        this.url = url;
        this.tabIndex = tabIndex;
        this.windowIndex = windowIndex;
        this.createdAt = createdAt;
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
}