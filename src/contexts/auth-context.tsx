
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
import { getUserProfile, updateUserProfile } from '@/services/user-service';
import type { UserProfile, OnboardingData } from '@/lib/types';
import { calculateHealthMetrics } from '@/lib/health-utils';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isFirebaseConfigured: boolean;
  signInWithGoogle: (onboardingData?: OnboardingData) => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, onboardingData: OnboardingData) => Promise<void>;
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
      return profile;
    } catch (e) {
      console.error("Failed to fetch user profile", e);
      setUserProfile(null);
      toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
      return null;
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
    // These errors are typically caused by the user closing the sign-in popup.
    // We can safely ignore them and don't need to show an error message or crash the app.
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Sign-in process was cancelled by the user.");
        return; // Exit gracefully.
    }

    console.error("Authentication Error", error);
    let message = "An unknown error occurred.";
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
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
    // Do not re-throw the error, as it will cause an unhandled promise rejection
    // and show an error overlay in Next.js. The toast is sufficient feedback.
  };

  const processOnboarding = async (uid: string, onboardingData: OnboardingData) => {
    const healthMetrics = calculateHealthMetrics(onboardingData);
    
    const finalProfileData: Partial<UserProfile> = {
      ...onboardingData,
      ...healthMetrics,
      onboarded: true,
    };
    
    // Convert units to imperial for storage
    if (onboardingData.units === 'metric') {
        finalProfileData.height = onboardingData.height / 2.54;
        finalProfileData.currentWeight = onboardingData.currentWeight / 0.453592;
        finalProfileData.goalWeight = onboardingData.goalWeight / 0.453592;
    }

    await updateUserProfile(uid, finalProfileData);
  }

  const signInWithGoogle = async (onboardingData?: OnboardingData) => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const existingProfile = await getUserProfile(user.uid);
      if (!existingProfile?.onboarded && onboardingData) {
        // This is a new user signing up via onboarding
        await processOnboarding(user.uid, onboardingData);
      }
      // For existing users, onAuthStateChanged will fetch their profile.
      // After processing, router will push to '/'
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const signUpWithEmail = async (email: string, password: string, onboardingData: OnboardingData) => {
    if (!auth) return;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await processOnboarding(result.user.uid, onboardingData);
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      handleAuthError(error as AuthError);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      router.push('/onboarding');
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
