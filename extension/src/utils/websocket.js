import { auth } from '../firebase/firebase.js';

/**
 * WebSocket client for real-time collaboration
 * Handles connection, authentication, and message routing
 */
class TabiaWebSocketClient {
    constructor() {
        this.socket = null;
        this.stompClient = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.subscriptions = new Map();
        this.messageHandlers = new Map();
        this.currentUser = null;
        
        // Bind methods to preserve 'this' context
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleConnectionError = this.handleConnectionError.bind(this);
        this.reconnect = this.reconnect.bind(this);
    }
    
    /**
     * Connect to WebSocket server with Firebase authentication
     */
    async connect() {
        try {
            // Get current user and token
            this.currentUser = auth.currentUser;
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const token = await this.currentUser.getIdToken();
            
            // Import SockJS and Stomp dynamically
            const SockJS = (await import('sockjs-client')).default;
            const { Stomp } = await import('@stomp/stompjs');
            
            // Create WebSocket connection
            this.socket = new SockJS('http://localhost:8080/ws');
            this.stompClient = Stomp.over(this.socket);
            
            // Configure STOMP client
            this.stompClient.configure({
                connectHeaders: {
                    'Authorization': `Bearer ${token}`
                },
                onConnect: (frame) => {
                    console.log('WebSocket connected:', frame);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;
                    
                    // Trigger connection event
                    this.triggerEvent('connected', { user: this.currentUser });
                },
                onDisconnect: (frame) => {
                    console.log('WebSocket disconnected:', frame);
                    this.isConnected = false;
                    this.subscriptions.clear();
                    
                    // Trigger disconnection event
                    this.triggerEvent('disconnected', { frame });
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                    this.handleConnectionError(new Error(`STOMP error: ${frame.headers.message}`));
                },
                onWebSocketError: (error) => {
                    console.error('WebSocket error:', error);
                    this.handleConnectionError(error);
                },
                debug: (str) => {
                    // Uncomment for debugging
                    // console.log('STOMP Debug:', str);
                }
            });
            
            // Activate connection
            this.stompClient.activate();
            
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.handleConnectionError(error);
        }
    }
    
    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.stompClient && this.isConnected) {
            this.stompClient.deactivate();
        }
        this.isConnected = false;
        this.subscriptions.clear();
        this.socket = null;
        this.stompClient = null;
    }
    
    /**
     * Subscribe to session updates
     */
    subscribeToSession(sessionId, handlers = {}) {
        if (!this.isConnected || !this.stompClient) {
            console.warn('WebSocket not connected, cannot subscribe to session');
            return null;
        }
        
        const subscriptionKey = `session-${sessionId}`;
        
        // Unsubscribe if already subscribed
        if (this.subscriptions.has(subscriptionKey)) {
            this.unsubscribeFromSession(sessionId);
        }
        
        const subscriptions = {};
        
        // Subscribe to session updates
        if (handlers.onSessionUpdate) {
            subscriptions.updates = this.stompClient.subscribe(
                `/topic/session/${sessionId}/updates`,
                (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Session update received:', data);
                    handlers.onSessionUpdate(data);
                }
            );
        }
        
        // Subscribe to tab updates
        if (handlers.onTabUpdate) {
            subscriptions.tabs = this.stompClient.subscribe(
                `/topic/session/${sessionId}/tabs`,
                (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Tab update received:', data);
                    handlers.onTabUpdate(data);
                }
            );
        }
        
        // Subscribe to presence updates
        if (handlers.onPresenceUpdate) {
            subscriptions.presence = this.stompClient.subscribe(
                `/topic/session/${sessionId}/presence`,
                (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Presence update received:', data);
                    handlers.onPresenceUpdate(data);
                }
            );
        }
        
        this.subscriptions.set(subscriptionKey, subscriptions);
        
        // Send join message to activate presence tracking
        this.sendMessage(`/app/session/${sessionId}/join`, {});
        
        return subscriptions;
    }
    
    /**
     * Unsubscribe from session updates
     */
    unsubscribeFromSession(sessionId) {
        const subscriptionKey = `session-${sessionId}`;
        const subscriptions = this.subscriptions.get(subscriptionKey);
        
        if (subscriptions) {
            // Unsubscribe from all topics
            Object.values(subscriptions).forEach(subscription => {
                if (subscription && subscription.unsubscribe) {
                    subscription.unsubscribe();
                }
            });
            
            this.subscriptions.delete(subscriptionKey);
            
            // Send leave message
            this.sendMessage(`/app/session/${sessionId}/leave`, {});
        }
    }
    
    /**
     * Add tab via WebSocket
     */
    addTab(sessionId, tabData) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }
        
        this.sendMessage(`/app/session/${sessionId}/add-tab`, tabData);
    }
    
    /**
     * Remove tab via WebSocket
     */
    removeTab(sessionId, tabId) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }
        
        this.sendMessage(`/app/session/${sessionId}/remove-tab/${tabId}`, {});
    }
    
    /**
     * Update tab via WebSocket
     */
    updateTab(sessionId, tabId, updateData) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }
        
        this.sendMessage(`/app/session/${sessionId}/update-tab/${tabId}`, updateData);
    }
    
    /**
     * Send message to server
     */
    sendMessage(destination, body) {
        if (!this.stompClient || !this.isConnected) {
            throw new Error('WebSocket not connected');
        }
        
        this.stompClient.publish({
            destination,
            body: JSON.stringify(body)
        });
    }
    
    /**
     * Handle connection errors and attempt reconnection
     */
    handleConnectionError(error) {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
            
            setTimeout(() => {
                this.reconnect();
            }, this.reconnectDelay);
            
            // Exponential backoff
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        } else {
            console.error('Max reconnection attempts reached');
            this.triggerEvent('maxReconnectAttemptsReached', { error });
        }
    }
    
    /**
     * Attempt to reconnect
     */
    async reconnect() {
        try {
            console.log('Reconnecting to WebSocket...');
            await this.connect();
        } catch (error) {
            console.error('Reconnection failed:', error);
            this.handleConnectionError(error);
        }
    }
    
    /**
     * Add event listener
     */
    addEventListener(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    }
    
    /**
     * Remove event listener
     */
    removeEventListener(event, handler) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    /**
     * Trigger event to listeners
     */
    triggerEvent(event, data) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            currentUser: this.currentUser?.uid || null
        };
    }
}

// Create singleton instance
export const webSocketClient = new TabiaWebSocketClient();

// Auto-connect when user is authenticated
auth.onAuthStateChanged((user) => {
    if (user && !webSocketClient.isConnected) {
        // Small delay to ensure token is ready
        setTimeout(() => {
            webSocketClient.connect();
        }, 1000);
    } else if (!user && webSocketClient.isConnected) {
        webSocketClient.disconnect();
    }
});
