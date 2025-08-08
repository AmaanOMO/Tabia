package com.tabia.service;

import com.tabia.model.User;
import com.tabia.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Service for user management operations
 */
@Service
@Transactional
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Create or update user information from Firebase authentication
     * This is called during the authentication process
     */
    public User createOrUpdateUser(String uid, String email, String name, String photoUrl) {
        Optional<User> existingUser = userRepository.findById(uid);
        
        if (existingUser.isPresent()) {
            // Update existing user with latest info from Firebase
            User user = existingUser.get();
            user.setEmail(email);
            user.setName(name);
            user.setPhotoUrl(photoUrl);
            
            logger.debug("Updated user: {} ({})", name, email);
            return userRepository.save(user);
        } else {
            // Create new user
            User newUser = new User(uid, email, name, photoUrl);
            User savedUser = userRepository.save(newUser);
            
            logger.info("Created new user: {} ({})", name, email);
            return savedUser;
        }
    }
    
    /**
     * Find user by Firebase UID
     */
    @Transactional(readOnly = true)
    public Optional<User> findByUid(String uid) {
        return userRepository.findById(uid);
    }
    
    /**
     * Find user by email address
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}