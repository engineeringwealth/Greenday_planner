import { db } from '@/lib/firebase';
import type { MealLog } from '@/lib/types';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  orderBy,
  where,
} from 'firebase/firestore';
import { startOfDay, endOfDay, subDays } from 'date-fns';


if (!db) {
  throw new Error("Firestore is not initialized. Make sure your Firebase config is correct.");
}

const getMealLogsCollection = (userId: string) => {
  return collection(db, 'users', userId, 'mealLogs');
};

export const getMealLogs = (
    userId: string, 
    onLogsUpdated: (logs: MealLog[]) => void,
    onError: (error: Error) => void
): (() => void) => {
  const mealLogsCollection = getMealLogsCollection(userId);
  
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const q = query(
      mealLogsCollection, 
      where('createdAt', '>=', todayStart),
      where('createdAt', '<=', todayEnd),
      orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, querySnapshot => {
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        foodItems: data.foodItems,
        totalCalories: data.totalCalories,
        totalProtein: data.totalProtein,
        totalCarbs: data.totalCarbs,
        totalFat: data.totalFat,
        photoUrl: data.photoUrl,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as MealLog;
    });
    onLogsUpdated(logs);
  }, (error) => {
    console.error("Error fetching meal logs:", error);
    onError(new Error("Failed to fetch real-time meal logs."));
  });

  return unsubscribe;
};

export const getMealLogHistory = (
    userId: string,
    days: number,
    onHistoryUpdated: (logs: MealLog[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    const mealLogsCollection = getMealLogsCollection(userId);
    const startDate = startOfDay(subDays(new Date(), days - 1));

    const q = query(
        mealLogsCollection,
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, querySnapshot => {
        const logs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                foodItems: data.foodItems,
                totalCalories: data.totalCalories,
                totalProtein: data.totalProtein,
                totalCarbs: data.totalCarbs,
                totalFat: data.totalFat,
                photoUrl: data.photoUrl,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as MealLog;
        });
        onHistoryUpdated(logs);
    }, (error) => {
        console.error("Error fetching meal log history:", error);
        onError(new Error("Failed to fetch meal log history."));
    });

    return unsubscribe;
};


export const addMealLog = async (userId: string, mealData: Omit<MealLog, 'id' | 'createdAt'>): Promise<string> => {
  const mealLogsCollection = getMealLogsCollection(userId);
  const docRef = await addDoc(mealLogsCollection, {
    ...mealData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};


export const deleteMealLog = async (userId: string, logId: string): Promise<void> => {
  const logDoc = doc(db, 'users', userId, 'mealLogs', logId);
  await deleteDoc(logDoc);
};
