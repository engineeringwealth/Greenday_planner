
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

if (!db) {
  throw new Error("Firestore is not initialized. Make sure your Firebase config is correct.");
}

/**
 * Retrieves a user's profile from Firestore.
 * The user profile is stored on the document in the 'users' collection with the user's UID.
 * @param userId The UID of the user.
 * @returns The user's profile object, or null if it doesn't exist.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);
  
  if (docSnap.exists()) {
    return { uid: userId, ...docSnap.data() } as UserProfile;
  }
  
  // Return null if no profile has been created yet.
  return null;
};

/**
 * Creates or updates a user's profile in Firestore.
 * Uses { merge: true } to avoid overwriting existing fields unintentionally.
 * @param userId The UID of the user.
 * @param profileData The data to set on the user's profile.
 */
export const updateUserProfile = async (userId: string, profileData: Partial<Omit<UserProfile, 'uid'>>): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, profileData, { merge: true });
};
