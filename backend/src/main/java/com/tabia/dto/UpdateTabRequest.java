package com.tabia.dto;

/**
 * DTO for updating an existing tab
 */
public class UpdateTabRequest {
    
    private String title;
    private String url;
    private Integer tabIndex;
    private Integer windowIndex;
    
    // Constructors
    public UpdateTabRequest() {}
    
    public UpdateTabRequest(String title, String url, Integer tabIndex, Integer windowIndex) {
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