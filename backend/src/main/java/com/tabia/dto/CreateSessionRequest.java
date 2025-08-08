package com.tabia.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * DTO for creating a new session with tabs
 */
public class CreateSessionRequest {
    
    @NotBlank(message = "Session name is required")
    private String name;
    
    @NotNull(message = "Session type is required")
    private Boolean isWindowSession; // true for "window" type, false for "tab" type
    
    @Valid
    @NotNull(message = "Tabs list is required")
    private List<TabDto> tabs;
    
    // Constructors
    public CreateSessionRequest() {}
    
    public CreateSessionRequest(String name, Boolean isWindowSession, List<TabDto> tabs) {
        this.name = name;
        this.isWindowSession = isWindowSession;
        this.tabs = tabs;
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Boolean getIsWindowSession() {
        return isWindowSession;
    }
    
    public void setIsWindowSession(Boolean isWindowSession) {
        this.isWindowSession = isWindowSession;
    }
    
    public List<TabDto> getTabs() {
        return tabs;
    }
    
    public void setTabs(List<TabDto> tabs) {
        this.tabs = tabs;
    }
    
    /**
     * Nested DTO for tabs in session creation
     */
    public static class TabDto {
        @NotBlank(message = "Tab title is required")
        private String title;
        
        @NotBlank(message = "Tab URL is required")
        private String url;
        
        private Integer tabIndex = 0; // Position within window
        private Integer windowIndex = 0; // Which window (for multi-window sessions)
        
        // Constructors
        public TabDto() {}
        
        public TabDto(String title, String url, Integer tabIndex, Integer windowIndex) {
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
}