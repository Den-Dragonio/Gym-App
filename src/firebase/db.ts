import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export const createUserDocument = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    try {
      await setDoc(userRef, {
        createdAt: new Date().toISOString(),
        ...data
      });
    } catch (error) {
      console.error('Error creating user document', error);
    }
  }
};

export const getUserDocument = async (uid: string) => {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
  } catch (error) {
    console.error('Error fetching user', error);
  }
  return null;
};

export const updateUserProfile = async (uid: string, updates: any) => {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating profile', error);
    throw error;
  }
};
