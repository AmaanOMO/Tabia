package com.tabia.repository;

import com.tabia.model.Tab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Tab entity operations
 */
@Repository
public interface TabRepository extends JpaRepository<Tab, UUID> {
    
    /**
     * Find all tabs for a specific session, ordered by window and tab index
     */
    List<Tab> findBySessionIdOrderByWindowIndexAscTabIndexAsc(UUID sessionId);
    
    /**
     * Find tab by ID only if user has access to the session
     */
    @Query("SELECT t FROM Tab t " +
           "JOIN t.session s " +
           "LEFT JOIN s.collaborators c " +
           "WHERE t.id = :tabId AND (s.ownerId = :userId OR c.userId = :userId)")
    Optional<Tab> findByIdAndUserHasAccess(@Param("tabId") UUID tabId, 
                                           @Param("userId") String userId);
    
    /**
     * Find the maximum tab index for a session and window
     * Used when adding new tabs to determine position
     */
    @Query("SELECT COALESCE(MAX(t.tabIndex), -1) FROM Tab t " +
           "WHERE t.sessionId = :sessionId AND t.windowIndex = :windowIndex")
    Integer findMaxTabIndexForWindow(@Param("sessionId") UUID sessionId, 
                                     @Param("windowIndex") Integer windowIndex);
    
    /**
     * Count tabs in a specific session
     */
    long countBySessionId(UUID sessionId);
}