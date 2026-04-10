import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, writeBatch 
} from 'firebase/firestore';
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

export const updateWorkout = async (workoutId: string, updates: any) => {
  if (!workoutId) return;
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, updates);
  } catch (error) {
    console.error('Error updating workout', error);
    throw error;
  }
};

export const deleteWorkout = async (workoutId: string) => {
  if (!workoutId) return;
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    await deleteDoc(workoutRef);
  } catch (error) {
    console.error('Error deleting workout', error);
    throw error;
  }
};

/**
 * Deep delete of all user-related data across collections
 */
export const deleteAllUserData = async (uid: string) => {
    if (!uid) return;
    const batch = writeBatch(db);

    // 1. Workouts
    const workoutsQ = query(collection(db, 'workouts'), where('userId', '==', uid));
    const workoutsSnap = await getDocs(workoutsQ);
    workoutsSnap.forEach(d => batch.delete(d.ref));

    // 2. Friendships
    const friendshipsQ = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
    const friendshipsSnap = await getDocs(friendshipsQ);
    friendshipsSnap.forEach(d => batch.delete(d.ref));

    // 3. Blocks (as blocker)
    const blocks1Q = query(collection(db, 'blocks'), where('blockerId', '==', uid));
    const blocks1Snap = await getDocs(blocks1Q);
    blocks1Snap.forEach(d => batch.delete(d.ref));

    // 4. Blocks (as blocked)
    const blocks2Q = query(collection(db, 'blocks'), where('blockedId', '==', uid));
    const blocks2Snap = await getDocs(blocks2Q);
    blocks2Snap.forEach(d => batch.delete(d.ref));

    // 5. User document itself
    batch.delete(doc(db, 'users', uid));

    await batch.commit();
};
