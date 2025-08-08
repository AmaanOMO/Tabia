package com.tabia.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase configuration for authentication
 */
@Configuration
public class FirebaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    @Value("${firebase.project-id}")
    private String projectId;
    
    @Value("${firebase.credentials}")
    private String firebaseCredentials;
    
    @Bean
    public FirebaseAuth firebaseAuth() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            InputStream credentialsStream = new ByteArrayInputStream(firebaseCredentials.getBytes());
            GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream);
            
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId(projectId)
                .build();
            
            FirebaseApp.initializeApp(options);
            logger.info("Firebase initialized successfully for project: {}", projectId);
        }
        
        return FirebaseAuth.getInstance();
    }
}