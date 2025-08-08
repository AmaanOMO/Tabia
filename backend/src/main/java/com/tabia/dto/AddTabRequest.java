package com.tabia.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for adding a new tab to a session
 */
public class AddTabRequest {
    
    @NotBlank(message = "Tab title is required")
    private String title;
    
    @NotBlank(message = "Tab URL is required")
    private String url;
    
    private Integer tabIndex; // If not provided, will be added at the end
    private Integer windowIndex = 0; // Default to first window
    
    // Constructors
    public AddTabRequest() {}
    
    public AddTabRequest(String title, String url, Integer tabIndex, Integer windowIndex) {
        this.title = title;
        this.url = url;
        this.tabIndex = tabIndex;
        this.windowIndex = windowIndex;
    }
    
    // Getters and Setters
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
}