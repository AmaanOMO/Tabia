import React from 'react';
import { AuthProvider } from './context/authContext';
import LoginButton from './components/LoginButton';
import SessionManager from './components/SessionManager';
import { useAuth } from './context/authContext';

// Main app content - shows different things based on login status
function AppContent() {
    const { userLoggedIn, currentUser } = useAuth();

    if (userLoggedIn) {
        // User is logged in - show the main app
        return (
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-gray-800">Tabia</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            {currentUser?.displayName || currentUser?.email}
                        </span>
                        <LogoutButton />
                    </div>
                </div>
                <SessionManager />
            </div>
        );
    } else {
        // User is not logged in - show login screen
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Tabia</h1>
                <p className="text-gray-600 mb-6">
                    Save and organize your browsing sessions
                </p>
                <LoginButton />
            </div>
        );
    }
}

// Logout button component
function LogoutButton() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
        >
            Logout
        </button>
    );
}

// Main App component that wraps everything with the AuthProvider
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App; 