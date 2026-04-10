import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB3-FvwtI8A6e9x6qBTDun6zbfs_R-graI",
  authDomain: "gym-app-9e72b.firebaseapp.com",
  projectId: "gym-app-9e72b",
  storageBucket: "gym-app-9e72b.firebasestorage.app",
  messagingSenderId: "111756141284",
  appId: "1:111756141284:web:532f20b0813ac0bd1582f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
