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
  accountNumber?: string;
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
            .then(async (profile) => {
              // If profile doesn't exist, create it
              if (!profile) {
                logger.warn(
                  "User profile not found, will be created on next login"
                );
                setUserProfile({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName:
                    firebaseUser.displayName ||
                    firebaseUser.email?.split("@")[0] ||
                    "User",
                  accountType: "general",
                  marketingOptOut: false,
                  createdAt: new Date(),
                  lastLogin: new Date(),
                });
                return;
              }

              setUserProfile(profile);
              // Claim any guest orders associated with this email
              try {
                if (firebaseUser.email) {
                  const { claimGuestOrdersForUser } = await import(
                    "../services/database"
                  );
                  claimGuestOrdersForUser(firebaseUser.uid, firebaseUser.email);
                }
              } catch (e) {
                logger.warn("Guest order claim failed", { err: String(e) });
              }
              // Assign account number on login if missing (idempotent)
              try {
                if (profile && !profile.accountNumber) {
                  const { getCurrentUser } = await import("../services/auth");
                  const current = getCurrentUser();
                  if (current && typeof (current as unknown) === "object") {
                    const getIdToken = (
                      current as unknown as {
                        getIdToken?: () => Promise<string>;
                      }
                    ).getIdToken;
                    const idToken =
                      typeof getIdToken === "function"
                        ? await getIdToken()
                        : undefined;
                    if (idToken) {
                      await fetch("/api/users/assign-account-number", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                          uid: firebaseUser.uid,
                          accountType: profile.accountType || "general",
                        }),
                      });
                      // Refresh profile after assignment
                      try {
                        const refreshed = await getUserProfile(
                          firebaseUser.uid
                        );
                        setUserProfile(refreshed);
                      } catch (e) {
                        logger.warn("Profile refresh after assign failed", {
                          err: String(e),
                        });
                      }
                    }
                  }
                }
              } catch (e) {
                logger.warn("Assign-on-login failed", { err: String(e) });
              }
            })
            .catch((error) => {
              logger.error("Failed to load user profile", {
                error: String(error),
              });
              // Set a minimal profile so the user can still use the app
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split("@")[0] ||
                  "User",
                accountType: "general",
                marketingOptOut: false,
                createdAt: new Date(),
                lastLogin: new Date(),
              });
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
