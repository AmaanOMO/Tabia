import React, { useState, useEffect, useContext, createContext } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doSignInWithGoogle, doSignOut } from "../../firebase/auth";

// Create a context - this is like a family meeting room where everyone can share information
const AuthContext = createContext();

// Custom hook to use the auth context - other components can use this
export function useAuth() {
    return useContext(AuthContext);
}

// Provider component that wraps your app and provides auth data to all children
export function AuthProvider({ children }) {
    // State to track the current user and loading status
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    // Function to handle Google login
    const login = async () => {
        try {
            const result = await doSignInWithGoogle();
            return result;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    // Function to handle logout
    const logout = async () => {
        try {
            await doSignOut();
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    // Function to initialize user when auth state changes
    const initializeUser = (user) => {
        if (user) {
            // User is logged in
            setCurrentUser({ ...user });
            setUserLoggedIn(true);
        } else {
            // User is logged out
            setCurrentUser(null);
            setUserLoggedIn(false);
        }
        setLoading(false);
    };

    // Listen for auth state changes (when user logs in/out)
    useEffect(() => {
        // onAuthStateChanged returns a function to unsubscribe
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        
        // Clean up the listener when component unmounts
        return unsubscribe;
    }, []);

    // Value object that will be shared with all child components
    const value = {
        currentUser,
        userLoggedIn,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
