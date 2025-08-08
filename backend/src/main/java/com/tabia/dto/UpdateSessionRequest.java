package com.tabia.dto;

/**
 * DTO for updating session properties (rename, star/unstar)
 */
public class UpdateSessionRequest {
    
    private String name;
    private Boolean isStarred;
    
    // Constructors
    public UpdateSessionRequest() {}
    
    public UpdateSessionRequest(String name, Boolean isStarred) {
        this.name = name;
        this.isStarred = isStarred;
    }
    
    // Getters and Setters
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
}