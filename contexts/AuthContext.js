import React, { createContext, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const handleGoogleSignIn = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ handleGoogleSignIn, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}