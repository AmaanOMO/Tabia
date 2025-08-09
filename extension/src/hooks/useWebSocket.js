import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketClient } from '../utils/websocket.js';

/**
 * Custom hook for WebSocket functionality in React components
 * Provides session subscription, real-time updates, and connection status
 */
export const useWebSocket = () => {
    const [connectionStatus, setConnectionStatus] = useState({
        isConnected: false,
        reconnectAttempts: 0,
        currentUser: null
    });
    
    const [error, setError] = useState(null);
    const connectionStatusRef = useRef(connectionStatus);
    
    // Update connection status
    const updateConnectionStatus = useCallback(() => {
        const status = webSocketClient.getConnectionStatus();
        setConnectionStatus(status);
        connectionStatusRef.current = status;
    }, []);
    
    // Setup event listeners
    useEffect(() => {
        const handleConnected = (data) => {
            console.log('WebSocket connected:', data);
            setError(null);
            updateConnectionStatus();
        };
        
        const handleDisconnected = (data) => {
            console.log('WebSocket disconnected:', data);
            updateConnectionStatus();
        };
        
        const handleMaxReconnectAttempts = (data) => {
            console.error('Max reconnection attempts reached:', data);
            setError('Failed to connect to real-time server. Please refresh the page.');
            updateConnectionStatus();
        };
        
        // Add event listeners
        webSocketClient.addEventListener('connected', handleConnected);
        webSocketClient.addEventListener('disconnected', handleDisconnected);
        webSocketClient.addEventListener('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
        
        // Initial status update
        updateConnectionStatus();
        
        // Cleanup
        return () => {
            webSocketClient.removeEventListener('connected', handleConnected);
            webSocketClient.removeEventListener('disconnected', handleDisconnected);
            webSocketClient.removeEventListener('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
        };
    }, [updateConnectionStatus]);
    
    // Connect to WebSocket
    const connect = useCallback(async () => {
        try {
            setError(null);
            await webSocketClient.connect();
        } catch (error) {
            console.error('Failed to connect:', error);
            setError(error.message);
        }
    }, []);
    
    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        webSocketClient.disconnect();
        updateConnectionStatus();
    }, [updateConnectionStatus]);
    
    // Subscribe to session updates
    const subscribeToSession = useCallback((sessionId, handlers) => {
        if (!connectionStatusRef.current.isConnected) {
            console.warn('Cannot subscribe to session - WebSocket not connected');
            return null;
        }
        
        return webSocketClient.subscribeToSession(sessionId, handlers);
    }, []);
    
    // Unsubscribe from session
    const unsubscribeFromSession = useCallback((sessionId) => {
        webSocketClient.unsubscribeFromSession(sessionId);
    }, []);
    
    // WebSocket actions
    const actions = {
        addTab: useCallback((sessionId, tabData) => {
            webSocketClient.addTab(sessionId, tabData);
        }, []),
        
        removeTab: useCallback((sessionId, tabId) => {
            webSocketClient.removeTab(sessionId, tabId);
        }, []),
        
        updateTab: useCallback((sessionId, tabId, updateData) => {
            webSocketClient.updateTab(sessionId, tabId, updateData);
        }, [])
    };
    
    return {
        connectionStatus,
        error,
        connect,
        disconnect,
        subscribeToSession,
        unsubscribeFromSession,
        actions
    };
};

/**
 * Hook for subscribing to a specific session's real-time updates
 */
export const useSessionWebSocket = (sessionId, options = {}) => {
    const [sessionUpdates, setSessionUpdates] = useState([]);
    const [tabUpdates, setTabUpdates] = useState([]);
    const [presenceData, setPresenceData] = useState({
        activeUsers: [],
        userCount: 0
    });
    
    const { subscribeToSession, unsubscribeFromSession, connectionStatus } = useWebSocket();
    
    // Handle session updates
    const handleSessionUpdate = useCallback((update) => {
        console.log('Session update:', update);
        setSessionUpdates(prev => [...prev, update]);
        
        if (options.onSessionUpdate) {
            options.onSessionUpdate(update);
        }
    }, [options]);
    
    // Handle tab updates
    const handleTabUpdate = useCallback((update) => {
        console.log('Tab update:', update);
        setTabUpdates(prev => [...prev, update]);
        
        if (options.onTabUpdate) {
            options.onTabUpdate(update);
        }
    }, [options]);
    
    // Handle presence updates
    const handlePresenceUpdate = useCallback((update) => {
        console.log('Presence update:', update);
        setPresenceData({
            activeUsers: update.activeUsers || [],
            userCount: update.activeUsers ? update.activeUsers.length : 0,
            lastUpdate: update
        });
        
        if (options.onPresenceUpdate) {
            options.onPresenceUpdate(update);
        }
    }, [options]);
    
    // Subscribe/unsubscribe effect
    useEffect(() => {
        if (!sessionId || !connectionStatus.isConnected) {
            return;
        }
        
        console.log(`Subscribing to session ${sessionId} WebSocket updates`);
        
        const subscription = subscribeToSession(sessionId, {
            onSessionUpdate: handleSessionUpdate,
            onTabUpdate: handleTabUpdate,
            onPresenceUpdate: handlePresenceUpdate
        });
        
        return () => {
            console.log(`Unsubscribing from session ${sessionId} WebSocket updates`);
            unsubscribeFromSession(sessionId);
        };
    }, [sessionId, connectionStatus.isConnected, subscribeToSession, unsubscribeFromSession, 
        handleSessionUpdate, handleTabUpdate, handlePresenceUpdate]);
    
    // Clear updates when session changes
    useEffect(() => {
        setSessionUpdates([]);
        setTabUpdates([]);
        setPresenceData({ activeUsers: [], userCount: 0 });
    }, [sessionId]);
    
    return {
        sessionUpdates,
        tabUpdates,
        presenceData,
        isConnected: connectionStatus.isConnected
    };
};
