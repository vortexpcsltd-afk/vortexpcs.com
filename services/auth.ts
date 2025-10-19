/**
 * Firebase Authentication Service
 * Handles user authentication, registration, and session management
 */

import type { User, UserCredential } from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Register new user with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const { doc, setDoc } = await import('firebase/firestore');
    
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: new Date(),
      lastLogin: new Date(),
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register user');
  }
};

/**
 * Sign in with email and password
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date(),
    });
    
    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to log in');
  }
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  if (!auth || !googleProvider || !db) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const { doc, setDoc, getDoc } = await import('firebase/firestore');
    
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || 'User',
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
    } else {
      // Update last login
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date(),
      });
    }
    
    return user;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(error.message || 'Failed to log in with Google');
  }
};

/**
 * Log out current user
 */
export const logoutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message || 'Failed to log out');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error: any) {
    console.error('Get user profile error:', error);
    throw new Error(error.message || 'Failed to get user profile');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  uid: string, 
  updates: Partial<UserProfile>
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase to use authentication.');
  }
  
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error: any) {
    console.error('Update user profile error:', error);
    throw new Error(error.message || 'Failed to update user profile');
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  if (!auth) {
    console.warn('Firebase auth not initialized');
    return null;
  }
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase auth not initialized');
    // Call callback immediately with null user and return a no-op unsubscribe function
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  
  // We need to return the unsubscribe function synchronously, but we're doing async import
  // So we'll use a wrapper
  let unsubscribe: (() => void) | null = null;
  
  import('firebase/auth').then(({ onAuthStateChanged: firebaseOnAuthStateChanged }) => {
    unsubscribe = firebaseOnAuthStateChanged(auth!, callback);
  }).catch((error) => {
    console.error('Error loading Firebase auth:', error);
    callback(null);
  });
  
  // Return an unsubscribe function that calls the real one when available
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};
