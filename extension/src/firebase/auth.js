import { auth } from "firebase";
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut 
} from "firebase/auth";

export const doSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Always show account picker
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    try {
        const result = await signInWithPopup(auth, provider);
        return result;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

export const doSignOut = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign-out error:', error);
        throw error;
    }
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

