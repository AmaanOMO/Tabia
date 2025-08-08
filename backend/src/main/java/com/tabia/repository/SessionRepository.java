package com.tabia.repository;

import com.tabia.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Session entity operations
 */
@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    
    /**
     * Find all sessions owned by a specific user
     */
    List<Session> findByOwnerIdOrderByUpdatedAtDesc(String ownerId);
    
    /**
     * Find all sessions where user is owner OR collaborator
     * This supports the unified session list requirement
     */
    @Query("SELECT DISTINCT s FROM Session s " +
           "LEFT JOIN s.collaborators c " +
           "WHERE s.ownerId = :userId OR c.userId = :userId " +
           "ORDER BY s.updatedAt DESC")
    List<Session> findAllUserSessions(@Param("userId") String userId);
    
    /**
     * Find session by ID only if user is owner or collaborator
     */
    @Query("SELECT s FROM Session s " +
           "LEFT JOIN s.collaborators c " +
           "WHERE s.id = :sessionId AND (s.ownerId = :userId OR c.userId = :userId)")
    Optional<Session> findByIdAndUserHasAccess(@Param("sessionId") UUID sessionId, 
                                               @Param("userId") String userId);
    
    /**
     * Find starred sessions for a user
     */
    @Query("SELECT DISTINCT s FROM Session s " +
           "LEFT JOIN s.collaborators c " +
           "WHERE (s.ownerId = :userId OR c.userId = :userId) AND s.isStarred = true " +
           "ORDER BY s.updatedAt DESC")
    List<Session> findStarredSessionsForUser(@Param("userId") String userId);
}