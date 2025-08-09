package com.tabia.controller;

import com.tabia.dto.websocket.SessionUpdateMessage;
import com.tabia.dto.websocket.TabUpdateMessage;
import com.tabia.dto.websocket.UserPresenceMessage;
import com.tabia.service.UserPresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for testing WebSocket functionality
 * Provides endpoints to manually trigger WebSocket messages for testing
 */
@RestController
@RequestMapping("/api/websocket-test")
public class WebSocketTestController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final UserPresenceService userPresenceService;
    
    public WebSocketTestController(SimpMessagingTemplate messagingTemplate, UserPresenceService userPresenceService) {
        this.messagingTemplate = messagingTemplate;
        this.userPresenceService = userPresenceService;
    }
    
    /**
     * Test session update broadcast
     * POST /api/websocket-test/session-update/{sessionId}
     */
    @PostMapping("/session-update/{sessionId}")
    public ResponseEntity<Map<String, Object>> testSessionUpdate(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "SESSION_RENAMED") String updateType,
            @RequestParam(defaultValue = "Test Session") String sessionName) {
        
        SessionUpdateMessage message = new SessionUpdateMessage(
            SessionUpdateMessage.UpdateType.valueOf(updateType),
            sessionId,
            sessionName,
            "test-user-123",
            "Test User",
            "test@example.com"
        );
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/updates", message);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Session update broadcasted");
        response.put("sessionId", sessionId);
        response.put("updateType", updateType);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test tab update broadcast
     * POST /api/websocket-test/tab-update/{sessionId}
     */
    @PostMapping("/tab-update/{sessionId}")
    public ResponseEntity<Map<String, Object>> testTabUpdate(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "TAB_ADDED") String updateType,
            @RequestParam(defaultValue = "Test Tab") String tabTitle,
            @RequestParam(defaultValue = "https://example.com") String tabUrl) {
        
        // Create a mock tab response
        com.tabia.dto.TabResponse mockTab = new com.tabia.dto.TabResponse(
            UUID.randomUUID(),
            sessionId,
            tabTitle,
            tabUrl,
            0,
            0,
            java.time.LocalDateTime.now()
        );
        
        TabUpdateMessage message = new TabUpdateMessage(
            TabUpdateMessage.UpdateType.valueOf(updateType),
            sessionId,
            mockTab,
            "test-user-123",
            "Test User"
        );
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/tabs", message);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Tab update broadcasted");
        response.put("sessionId", sessionId);
        response.put("updateType", updateType);
        response.put("tab", mockTab);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test user presence broadcast
     * POST /api/websocket-test/presence/{sessionId}
     */
    @PostMapping("/presence/{sessionId}")
    public ResponseEntity<Map<String, Object>> testPresence(
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "USER_JOINED") String presenceType,
            @RequestParam(defaultValue = "test-user-123") String userId,
            @RequestParam(defaultValue = "Test User") String userName) {
        
        UserPresenceMessage message = new UserPresenceMessage(
            UserPresenceMessage.PresenceType.valueOf(presenceType),
            sessionId,
            userId,
            userName,
            "test@example.com"
        );
        
        // Get current active users
        message.setActiveUsers(userPresenceService.getActiveUsersForSession(sessionId));
        
        messagingTemplate.convertAndSend("/topic/session/" + sessionId + "/presence", message);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Presence update broadcasted");
        response.put("sessionId", sessionId);
        response.put("presenceType", presenceType);
        response.put("activeUsers", message.getActiveUsers());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get active users for a session
     * GET /api/websocket-test/presence/{sessionId}
     */
    @GetMapping("/presence/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSessionPresence(@PathVariable UUID sessionId) {
        List<UserPresenceMessage.UserInfo> activeUsers = userPresenceService.getActiveUsersForSession(sessionId);
        int userCount = userPresenceService.getActiveUserCount(sessionId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("activeUserCount", userCount);
        response.put("activeUsers", activeUsers);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test WebSocket connection status
     * GET /api/websocket-test/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWebSocketStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("webSocketEnabled", true);
        response.put("messagingTemplateAvailable", messagingTemplate != null);
        response.put("endpoints", List.of(
            "/ws (with SockJS)",
            "/websocket (native)",
            "/topic/session/{sessionId}/updates",
            "/topic/session/{sessionId}/tabs",
            "/topic/session/{sessionId}/presence"
        ));
        response.put("testEndpoints", List.of(
            "POST /api/websocket-test/session-update/{sessionId}",
            "POST /api/websocket-test/tab-update/{sessionId}",
            "POST /api/websocket-test/presence/{sessionId}",
            "GET /api/websocket-test/presence/{sessionId}",
            "GET /api/websocket-test/status"
        ));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Broadcast test message to all sessions
     * POST /api/websocket-test/broadcast
     */
    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Object>> testBroadcast(
            @RequestParam(defaultValue = "Hello from WebSocket test!") String message) {
        
        Map<String, Object> testMessage = new HashMap<>();
        testMessage.put("type", "TEST_BROADCAST");
        testMessage.put("message", message);
        testMessage.put("timestamp", java.time.LocalDateTime.now());
        
        // Broadcast to all connected clients
        messagingTemplate.convertAndSend("/topic/test", testMessage);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Test message broadcasted to /topic/test");
        response.put("payload", testMessage);
        
        return ResponseEntity.ok(response);
    }
}
