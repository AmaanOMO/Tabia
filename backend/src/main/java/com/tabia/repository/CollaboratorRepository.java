package com.tabia.repository;

import com.tabia.model.Collaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Collaborator entity operations
 */
@Repository
public interface CollaboratorRepository extends JpaRepository<Collaborator, UUID> {
    
    /**
     * Find all collaborators for a specific session
     */
    List<Collaborator> findBySessionIdOrderByAddedAtDesc(UUID sessionId);
    
    /**
     * Find collaborator by session and user
     */
    Optional<Collaborator> findBySessionIdAndUserId(UUID sessionId, String userId);
    
    /**
     * Check if user is collaborator on a session
     */
    boolean existsBySessionIdAndUserId(UUID sessionId, String userId);
    
    /**
     * Find collaborator's role for a session
     */
    @Query("SELECT c.role FROM Collaborator c WHERE c.sessionId = :sessionId AND c.userId = :userId")
    Optional<Collaborator.CollaboratorRole> findRoleBySessionIdAndUserId(@Param("sessionId") UUID sessionId, 
                                                                          @Param("userId") String userId);
    
    /**
     * Remove collaborator from session
     */
    void deleteBySessionIdAndUserId(UUID sessionId, String userId);
}