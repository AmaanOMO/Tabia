import React from 'react';

function SessionManager() {
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