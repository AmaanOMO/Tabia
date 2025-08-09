import React, { useState, useEffect } from 'react';
import RealTimeSession from './RealTimeSession.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';

function SessionManager() {
    const [testSessionId, setTestSessionId] = useState('123e4567-e89b-12d3-a456-426614174000');
    const [showRealTime, setShowRealTime] = useState(false);
    const { connectionStatus, connect, disconnect, error } = useWebSocket();
    
    // Handle session updates from WebSocket
    const handleSessionUpdate = (update) => {
        console.log('Session updated:', update);
        // Here you would update your session data
    };
    
    // Handle tab updates from WebSocket
    const handleTabUpdate = (update) => {
        console.log('Tab updated:', update);
        // Here you would update your tab data
    };
    
    return (
        <div className="space-y-4">
            <div className="text-center py-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Welcome to Tabia!
                </h2>
                <p className="text-gray-500 text-sm">
                    Your session management features will appear here.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                    Save tabs, organize sessions, and more coming soon!
                </p>
            </div>
            
            {/* WebSocket Connection Status */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">🚀 Real-Time Features</h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                            Connection Status: 
                            <span className={`ml-1 font-medium ${
                                connectionStatus.isConnected ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </span>
                        <div className="flex space-x-2">
                            <button 
                                onClick={connect}
                                disabled={connectionStatus.isConnected}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Connect
                            </button>
                            <button 
                                onClick={disconnect}
                                disabled={!connectionStatus.isConnected}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            Error: {error}
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">Test Real-Time Demo:</span>
                        <button 
                            onClick={() => setShowRealTime(!showRealTime)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            {showRealTime ? 'Hide Demo' : 'Show Demo'}
                        </button>
                    </div>
                    
                    {showRealTime && (
                        <div className="mt-3">
                            <label className="block text-xs text-blue-700 mb-1">
                                Test Session ID:
                            </label>
                            <input
                                type="text"
                                value={testSessionId}
                                onChange={(e) => setTestSessionId(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-blue-300 rounded"
                                placeholder="Enter session ID to test"
                            />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Real-Time Demo Component */}
            {showRealTime && testSessionId && (
                <RealTimeSession
                    sessionId={testSessionId}
                    session={{ id: testSessionId, name: 'Test Session' }}
                    onSessionUpdate={handleSessionUpdate}
                    onTabUpdate={handleTabUpdate}
                />
            )}
            
            {/* Placeholder for future session features */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                    <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm text-gray-600">
                        📑 Save Current Session
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm text-gray-600">
                        🔍 View Saved Sessions
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm text-gray-600">
                        ⭐ Starred Sessions
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionManager; 