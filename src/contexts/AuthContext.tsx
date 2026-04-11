import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserDocument, getUserDocument, deleteAllUserData } from '../firebase/db';

export interface AppUser {
  uid: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  showEmail?: boolean;
  bio?: string;
  avatarUrl?: string;
  avatarPosition?: number;
  supplements?: string[];
  workoutNames?: string[];
  daysPlan?: string[];
  gender?: string;
  weight?: string;
  height?: string;
  benchPress?: string;
  squat?: string;
  deadlift?: string;
  startYear?: string;
  createdAt?: string;
  gyms?: any[];
  theme?: 'light' | 'dark' | 'system';
  accent?: 'blue' | 'green' | 'purple';
  measurementSystem?: 'metric' | 'imperial';
  language?: 'en' | 'ru';
  dateFormat?: 'dd/mm/yyyy' | 'mm/dd/yyyy';
  exerciseNames?: string[];
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (username: string, pass: string) => Promise<void>;
  register: (username: string, pass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROXY_DOMAIN = '@gym-tracker.local';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profileData = await getUserDocument(user.uid);
        setCurrentUser({
          uid: user.uid,
          username: user.email?.split('@')[0] || 'Unknown',
          ...profileData
        } as AppUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const login = async (username: string, pass: string) => {
    const proxyEmail = `${username.toLowerCase()}${PROXY_DOMAIN}`;
    await signInWithEmailAndPassword(auth, proxyEmail, pass);
  };

  const register = async (username: string, pass: string) => {
    const cleanUsername = username.toLowerCase();
    const proxyEmail = `${cleanUsername}${PROXY_DOMAIN}`;
    const userCredential = await createUserWithEmailAndPassword(auth, proxyEmail, pass);
    
    await createUserDocument(userCredential.user.uid, {
      username: cleanUsername,
      email: '',
      showEmail: false,
      bio: '',
      avatarUrl: '',
      firstName: '',
      lastName: '',
      title: '',
      weight: '',
      height: '',
      startYear: new Date().getFullYear().toString(),
      gender: 'Male',
      benchPress: '0',
      squat: '0',
      deadlift: '0',
      gyms: [],
      daysPlan: ['Monday', 'Wednesday', 'Friday'],
      supplements: ['Magnesium', 'Collagen', 'Vitamin B'],
      workoutNames: ['Split', 'Full Body', 'Cardio']
    });
  };

  const deleteAccount = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      
      try {
          // 1. Delete Firestore Data
          await deleteAllUserData(uid);
          // 2. Delete Auth User
          await deleteUser(auth.currentUser);
      } catch (error: any) {
          console.error("Deletion failed", error);
          if (error.code === 'auth/requires-recent-login') {
              throw new Error("REAUTH_REQUIRED");
          }
          throw error;
      }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, login, register, deleteAccount }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
