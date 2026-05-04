/**
 * Authentication Context
 * 
 * Provides Firebase auth state to the entire app via React Context.
 * Handles sign-in with Google, sign-out, and loading state.
 * 
 * When Firebase is not configured, the app runs without authentication
 * (all users are treated as signed in).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** True when Firebase auth is active, false when running without auth */
  isAuthEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured); // only loading when auth is active

  // Listen for auth state changes (persists across refreshes)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase — skip auth, immediately ready
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      console.warn('Firebase auth not configured');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      // Don't throw on user-cancelled popups
      if (firebaseError.code === 'auth/popup-closed-by-user') return;
      if (firebaseError.code === 'auth/cancelled-popup-request') return;
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      // Clear session data
      try { sessionStorage.removeItem('factorymind_chat_messages'); } catch { /* ignore */ }
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        isAuthEnabled: isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and methods.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
