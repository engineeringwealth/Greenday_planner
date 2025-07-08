
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/services/user-service';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isFirebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth;

  const fetchUserProfile = useCallback(async (uid: string) => {
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
    } catch (e) {
      console.error("Failed to fetch user profile", e);
      setUserProfile(null);
      toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  }, [toast]);
  
  const refetchUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  }, [user, fetchUserProfile]);


  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setProfileLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured, fetchUserProfile]);

  const handleAuthError = (error: AuthError) => {
    console.error("Authentication Error", error);
    let message = "An unknown error occurred.";
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password. Please try again.';
        break;
      case 'auth/email-already-in-use':
        message = 'This email address is already in use.';
        break;
      case 'auth/weak-password':
        message = 'The password is too weak. Please use a stronger password.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      default:
        message = error.message;
        break;
    }
    toast({
      title: "Authentication Failed",
      description: message,
      variant: "destructive",
    });
  };

  const signInWithGoogle = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Let the AuthGuard handle redirection
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Let the AuthGuard handle redirection
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let the AuthGuard handle redirection
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const value = { user, userProfile, loading, profileLoading, isFirebaseConfigured, signInWithGoogle, signOut, signUpWithEmail, signInWithEmail, refetchUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
