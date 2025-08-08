package com.tabia.config;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Custom authentication token for Firebase authenticated users
 */
public class FirebaseAuthenticationToken extends AbstractAuthenticationToken {
    
    private final String uid;
    private final String email;
    private final String name;
    private final String photoUrl;
    
    public FirebaseAuthenticationToken(String uid, String email, String name, String photoUrl,
                                      Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.uid = uid;
        this.email = email;
        this.name = name;
        this.photoUrl = photoUrl;
        setAuthenticated(true);
    }
    
    @Override
    public Object getCredentials() {
        return null; // We don't need credentials after authentication
    }
    
    @Override
    public Object getPrincipal() {
        return uid; // Firebase UID is the principal
    }
    
    public String getUid() {
        return uid;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getName() {
        return name;
    }
    
    public String getPhotoUrl() {
        return photoUrl;
    }
}