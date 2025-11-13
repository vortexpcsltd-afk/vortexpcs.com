/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { onAuthStateChanged } from "../services/auth";
import { logger } from "../services/logger";

// Define types without importing from Firebase to avoid initialization issues
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  marketingOptOut?: boolean;
  role?: string;
  accountType?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: false,
  isAuthenticated: false,
  isAdmin: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Start with false since we're not loading anything initially

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load user profile from Firestore
        import("../services/auth").then(({ getUserProfile }) => {
          getUserProfile(firebaseUser.uid)
            .then((profile) => {
              setUserProfile(profile);
            })
            .catch((error) => {
              logger.error("Failed to load user profile:", error);
            });
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    // Prefer role-based admin from Firestore profile; fallback to legacy email check
    isAdmin:
      userProfile?.role?.toLowerCase?.() === "admin" ||
      userProfile?.email === "admin@vortexpcs.com" ||
      false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
