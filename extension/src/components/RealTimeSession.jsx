import React, { useState, useEffect, useCallback } from 'react';
import { Users, Wifi, WifiOff, Circle, AlertCircle } from 'lucide-react';
import { useSessionWebSocket } from '../hooks/useWebSocket.js';

/**
 * Real-time session component with WebSocket integration
 * Shows live collaboration, user presence, and real-time updates
 */
const RealTimeSession = ({ sessionId, session, onSessionUpdate, onTabUpdate }) => {
    const [notifications, setNotifications] = useState([]);
    const [showPresence, setShowPresence] = useState(true);
    
    const {
        sessionUpdates,
        tabUpdates,
        presenceData,
        isConnected
    } = useSessionWebSocket(sessionId, {
        onSessionUpdate: useCallback((update) => {
            // Handle session-level updates
            if (onSessionUpdate) {
                onSessionUpdate(update);
            }
            
            // Add notification
            addNotification({
                type: 'session',
                message: getSessionUpdateMessage(update),
                timestamp: new Date(),
                user: update.userName || 'Unknown User'
            });
        }, [onSessionUpdate]),
        
        onTabUpdate: useCallback((update) => {
            // Handle tab-level updates
            if (onTabUpdate) {
                onTabUpdate(update);
            }
            
            // Add notification
            addNotification({
                type: 'tab',
                message: getTabUpdateMessage(update),
                timestamp: new Date(),
                user: update.userName || 'Unknown User'
            });
        }, [onTabUpdate]),
        
        onPresenceUpdate: useCallback((update) => {
            // Add presence notification
            if (update.type === 'USER_JOINED') {
                addNotification({
                    type: 'presence',
                    message: `${update.userName} joined the session`,
                    timestamp: new Date(),
                    user: update.userName
                });
            } else if (update.type === 'USER_LEFT') {
                addNotification({
                    type: 'presence',
                    message: `${update.userName} left the session`,
                    timestamp: new Date(),
                    user: update.userName
                });
            }
        }, [])
    });
    
    // Add notification helper
    const addNotification = useCallback((notification) => {
        setNotifications(prev => {
            const newNotifications = [notification, ...prev.slice(0, 9)]; // Keep last 10
            return newNotifications;
        });
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n !== notification));
        }, 5000);
    }, []);
    
    // Clear old notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setNotifications(prev => {
                const now = new Date();
                return prev.filter(notification => {
                    const age = now - notification.timestamp;
                    return age < 30000; // Remove notifications older than 30 seconds
                });
            });
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);
    
    // Generate user update message
    const getSessionUpdateMessage = (update) => {
        switch (update.type) {
            case 'SESSION_RENAMED':
                return `renamed session to "${update.sessionName}"`;
            case 'SESSION_STARRED':
                return 'starred the session';
            case 'SESSION_UNSTARRED':
                return 'unstarred the session';
            default:
                return 'updated the session';
        }
    };
    
    // Generate tab update message
    const getTabUpdateMessage = (update) => {
        switch (update.type) {
            case 'TAB_ADDED':
                return `added tab "${update.tab?.title || 'Unknown'}"`;
            case 'TAB_REMOVED':
                return `removed tab "${update.tab?.title || 'Unknown'}"`;
            case 'TAB_UPDATED':
                return `updated tab "${update.tab?.title || 'Unknown'}"`;
            default:
                return 'updated a tab';
        }
    };
    
    // Format timestamp
    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Connection Status Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                    {isConnected ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                        isConnected ? 'text-green-700' : 'text-red-700'
                    }`}>
                        {isConnected ? 'Live' : 'Disconnected'}
                    </span>
                </div>
                
                {/* User Presence Toggle */}
                {presenceData.userCount > 0 && (
                    <button
                        onClick={() => setShowPresence(!showPresence)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                        <Users className="h-4 w-4" />
                        <span>{presenceData.userCount} online</span>
                    </button>
                )}
            </div>
            
            {/* User Presence */}
            {showPresence && presenceData.activeUsers.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Active Users</h4>
                    <div className="flex flex-wrap gap-2">
                        {presenceData.activeUsers.map((user, index) => (
                            <div
                                key={`${user.userId}-${index}`}
                                className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full border text-xs"
                            >
                                <Circle className="h-2 w-2 text-green-500 fill-current" />
                                <span className="text-gray-700">
                                    {user.userName || user.userEmail || 'Anonymous'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Real-time Notifications */}
            {notifications.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                    {notifications.map((notification, index) => (
                        <div
                            key={`${notification.timestamp}-${index}`}
                            className={`p-3 border-b border-gray-50 last:border-b-0 ${
                                notification.type === 'session' ? 'bg-blue-50' :
                                notification.type === 'tab' ? 'bg-green-50' :
                                'bg-yellow-50'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800">
                                        <span className="font-medium">{notification.user}</span>
                                        {' '}{notification.message}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                    {formatTime(notification.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Empty State */}
            {notifications.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                        {isConnected ? (
                            <>
                                <Users className="h-8 w-8 text-gray-400" />
                                <p className="text-sm">Real-time collaboration active</p>
                                <p className="text-xs text-gray-400">
                                    Changes will appear here as they happen
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-8 w-8 text-red-400" />
                                <p className="text-sm">Connection lost</p>
                                <p className="text-xs text-gray-400">
                                    Trying to reconnect...
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Debug Info (Development only) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-gray-100 border-t text-xs text-gray-600">
                    <details>
                        <summary className="cursor-pointer">Debug Info</summary>
                        <div className="mt-2 space-y-1">
                            <div>Session Updates: {sessionUpdates.length}</div>
                            <div>Tab Updates: {tabUpdates.length}</div>
                            <div>Active Users: {presenceData.userCount}</div>
                            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default RealTimeSession;
