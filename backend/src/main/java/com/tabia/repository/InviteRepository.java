package com.tabia.repository;

import com.tabia.model.Invite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Invite entity operations
 */
@Repository
public interface InviteRepository extends JpaRepository<Invite, UUID> {
    
    /**
     * Find invite by invite code
     */
    Optional<Invite> findByInviteCode(String inviteCode);
    
    /**
     * Find all active invites for a session (not used and not expired)
     */
    @Query("SELECT i FROM Invite i WHERE i.sessionId = :sessionId " +
           "AND i.used = false AND i.expiresAt > :now " +
           "ORDER BY i.createdAt DESC")
    List<Invite> findActiveInvitesForSession(@Param("sessionId") UUID sessionId, 
                                             @Param("now") LocalDateTime now);
    
    /**
     * Find all invites created by a specific user
     */
    List<Invite> findByCreatedByOrderByCreatedAtDesc(String createdBy);
    
    /**
     * Check if invite code already exists
     */
    boolean existsByInviteCode(String inviteCode);
    
    /**
     * Find valid (unused and not expired) invite by code
     */
    @Query("SELECT i FROM Invite i WHERE i.inviteCode = :inviteCode " +
           "AND i.used = false AND i.expiresAt > :now")
    Optional<Invite> findValidInviteByCode(@Param("inviteCode") String inviteCode, 
                                           @Param("now") LocalDateTime now);
}