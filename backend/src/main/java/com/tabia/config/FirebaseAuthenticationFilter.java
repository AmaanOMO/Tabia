package com.tabia.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.tabia.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter to authenticate requests using Firebase JWT tokens
 * Extracts the Authorization header, verifies the Firebase token,
 * and sets the authentication in the SecurityContext
 */
@Component
public class FirebaseAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthenticationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    
    private final FirebaseAuth firebaseAuth;
    private final UserService userService;
    
    public FirebaseAuthenticationFilter(FirebaseAuth firebaseAuth, UserService userService) {
        this.firebaseAuth = firebaseAuth;
        this.userService = userService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        // Skip authentication for health check and other public endpoints
        String path = request.getRequestURI();
        if (path.equals("/api/health") || path.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            String token = extractToken(request);
            if (token != null) {
                FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
                
                // Extract user information from Firebase token
                String uid = decodedToken.getUid();
                String email = decodedToken.getEmail();
                String name = decodedToken.getName();
                String photoUrl = (String) decodedToken.getClaims().get("picture");
                
                // Create or update user in database
                userService.createOrUpdateUser(uid, email, name, photoUrl);
                
                // Create authentication token and set in security context
                FirebaseAuthenticationToken authToken = new FirebaseAuthenticationToken(
                    uid, email, name, photoUrl, 
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
                
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                logger.debug("Successfully authenticated user: {} ({})", name, email);
            }
            
        } catch (FirebaseAuthException e) {
            logger.warn("Firebase token verification failed: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Invalid or expired token\"}");
            return;
        } catch (Exception e) {
            logger.error("Authentication error: ", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Authentication failed\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Extract Bearer token from Authorization header
     */
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}