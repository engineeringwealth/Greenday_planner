import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';
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
} from 'firebase/firestore';

if (!db) {
  throw new Error("Firestore is not initialized. Make sure your Firebase config is correct.");
}

const getTasksCollection = (userId: string) => {
  return collection(db, 'users', userId, 'tasks');
};

export const getTasks = (
    userId: string, 
    onTasksUpdated: (tasks: Task[]) => void,
    onError: (error: Error) => void
): (() => void) => {
  const tasksCollection = getTasksCollection(userId);
  const q = query(tasksCollection, orderBy('deadline', 'desc'));
  
  const unsubscribe = onSnapshot(q, querySnapshot => {
    const tasks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        details: data.details,
        completed: data.completed,
        deadline: (data.deadline as Timestamp).toDate(),
      };
    });
    onTasksUpdated(tasks);
  }, (error) => {
    console.error("Error fetching tasks:", error);
    onError(new Error("Failed to fetch real-time tasks."));
  });

  return unsubscribe;
};

export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'completed'>): Promise<void> => {
  const tasksCollection = getTasksCollection(userId);
  await addDoc(tasksCollection, {
    ...taskData,
    completed: false,
    deadline: Timestamp.fromDate(taskData.deadline),
  });
};

export const updateTask = async (userId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>): Promise<void> => {
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
  
  const dataToUpdate: { [key: string]: any } = { ...taskData };

  if (taskData.deadline) {
    dataToUpdate.deadline = Timestamp.fromDate(taskData.deadline);
  }

  await updateDoc(taskDoc, dataToUpdate);
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskDoc);
};
