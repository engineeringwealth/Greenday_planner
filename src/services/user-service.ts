
import { db } from '@/lib/firebase';
import type { UserProfile, WeightHistoryEntry } from '@/lib/types';
import { collection, doc, getDoc, setDoc, addDoc, Timestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

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

const getWeightHistoryCollection = (userId: string) => {
  return collection(db, 'users', userId, 'weightHistory');
};

/**
 * Adds a new weight entry to the user's weight history.
 * @param userId The UID of the user.
 * @param weightInLbs The weight in pounds to record.
 */
export const addWeightHistory = async (userId: string, weightInLbs: number): Promise<void> => {
  const historyCollection = getWeightHistoryCollection(userId);
  await addDoc(historyCollection, {
    weight: weightInLbs,
    date: Timestamp.now(),
  });
};

/**
 * Listens for real-time updates to the user's weight history.
 * @param userId The UID of the user.
 * @param onHistoryUpdated Callback function to handle the updated history data.
 * @param onError Callback function to handle errors.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const getWeightHistory = (
    userId: string,
    onHistoryUpdated: (history: WeightHistoryEntry[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    const historyCollection = getWeightHistoryCollection(userId);
    const q = query(historyCollection, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, querySnapshot => {
        const history = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                weight: data.weight,
                date: (data.date as Timestamp).toDate(),
            } as WeightHistoryEntry;
        });
        onHistoryUpdated(history);
    }, (error) => {
        console.error("Error fetching weight history:", error);
        onError(new Error("Failed to fetch weight history."));
    });
    return unsubscribe;
};
