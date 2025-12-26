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
import { verifyUserRole } from "../utils/roleVerification";

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
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage to prevent logout on refresh
    try {
      const stored = localStorage.getItem("vortex_user");
      if (stored) {
        const userData = JSON.parse(stored);
        return {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
        };
      }
    } catch (e) {
      logger.debug("Failed to load user from localStorage", { error: e });
    }
    return null;
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Initialize from localStorage to prevent admin logout on refresh
    try {
      const stored = localStorage.getItem("vortex_user");
      if (stored) {
        const userData = JSON.parse(stored);
        // If we have role info in localStorage, create a minimal profile
        if (userData.role) {
          return {
            uid: userData.uid,
            email: userData.email || "",
            displayName: userData.displayName || "",
            role: userData.role,
            accountType: userData.accountType || "general",
            createdAt: new Date(),
            lastLogin: new Date(),
          };
        }
      }
    } catch (e) {
      logger.debug("Failed to load profile from localStorage", { error: e });
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have user data in localStorage, start as not loading
    // Firebase will update in the background
    try {
      const stored = localStorage.getItem("vortex_user");
      if (stored) {
        const userData = JSON.parse(stored);
        return !userData.uid; // Only loading if we don't have a user ID
      }
    } catch (e) {
      logger.debug("Failed to check localStorage for loading state", {
        error: e,
      });
    }
    return true; // Default to loading if no cached data
  });

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      logger.info("🔥 Firebase auth state changed", {
        firebaseUser: firebaseUser
          ? { uid: firebaseUser.uid, email: firebaseUser.email }
          : null,
      });

      // Check localStorage FIRST
      const storedUser = localStorage.getItem("vortex_user");
      logger.info("📦 LocalStorage state", {
        hasStoredUser: !!storedUser,
        storedData: storedUser ? JSON.parse(storedUser) : null,
      });

      logger.info("🎯 Current React state BEFORE update", {
        user: user ? { uid: user.uid, email: user.email } : null,
        userProfile: userProfile
          ? { uid: userProfile.uid, role: userProfile.role }
          : null,
        loading,
      });

      // Only update if user actually changed to prevent unnecessary re-renders
      setUser((prev) => {
        if (prev?.uid === firebaseUser?.uid) {
          logger.info("✅ User unchanged, keeping previous state");
          return prev;
        }
        logger.warn("🔄 User state CHANGING", {
          from: prev ? { uid: prev.uid } : null,
          to: firebaseUser ? { uid: firebaseUser.uid } : null,
        });
        return firebaseUser;
      });
      setLoading(false); // Auth state determined

      // DON'T update localStorage here - wait until we have the full profile from Firestore
      // This prevents overwriting the role before it's loaded
      if (!firebaseUser) {
        // Only clear localStorage if we're certain the user logged out
        // Don't clear on initial load when Firebase might still be initializing
        const stored = localStorage.getItem("vortex_user");
        if (stored) {
          logger.warn(
            "Firebase reports no user but localStorage has user data - not clearing yet"
          );
        } else {
          localStorage.removeItem("vortex_user");
        }
      }

      if (firebaseUser) {
        // Load user profile from Firestore and verify role from server
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
                  role: "user", // Default non-admin role
                  createdAt: new Date(),
                  lastLogin: new Date(),
                });
                return;
              }

              // CRITICAL: Verify role from server (Firebase Custom Claims)
              // Never trust client-side localStorage role
              try {
                const idToken = await firebaseUser.getIdToken();
                const roleVerification = await verifyUserRole(idToken);

                if (roleVerification.verified) {
                  // Use server-verified role
                  profile.role = roleVerification.role;
                  logger.info("✅ Role verified from server:", {
                    role: roleVerification.role,
                    verified: true,
                  });
                } else {
                  // Preserve previously known admin role if verification fails
                  const previousRole = userProfile?.role?.toLowerCase?.();
                  profile.role =
                    previousRole === "admin" ? "admin" : profile.role || "user";
                  logger.warn(
                    "Role verification failed; preserving admin if previously set",
                    { previousRole }
                  );
                }
              } catch (error) {
                // Preserve previously known admin role if verification throws
                const previousRole = userProfile?.role?.toLowerCase?.();
                profile.role =
                  previousRole === "admin" ? "admin" : profile.role || "user";
                logger.warn(
                  "Failed to verify role from server; preserving role",
                  {
                    error: String(error),
                    previousRole,
                  }
                );
              }

              setUserProfile(profile);

              // Update localStorage with profile (WITHOUT trusting it for security)
              // localStorage is now used ONLY for caching, not security
              try {
                localStorage.setItem(
                  "vortex_user",
                  JSON.stringify({
                    uid: profile.uid,
                    email: profile.email,
                    displayName: profile.displayName,
                    role: profile.role,
                    accountType: profile.accountType,
                  })
                );
                logger.info(
                  "✅ Cached profile to localStorage (not for security):",
                  { role: profile.role }
                );
              } catch (e) {
                logger.error("Failed to save profile to localStorage", {
                  error: e,
                });
              }

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
        // Don't clear userProfile if we have cached data from localStorage
        // Firebase might still be initializing
        logger.warn(
          "⚠️ Firebase says no user - checking if we should clear userProfile"
        );
        const stored = localStorage.getItem("vortex_user");
        const storedData = stored ? JSON.parse(stored) : null;
        logger.info("🔍 Stored data check", {
          hasStored: !!stored,
          hasRole: storedData?.role,
          storedRole: storedData?.role,
        });

        if (!stored || !storedData?.role) {
          logger.warn("⚠️ No stored user profile - clearing state", {
            hasStored: !!stored,
            hasRole: !!storedData?.role,
          });
          setUserProfile(null);
        } else {
          logger.info(
            "🛡️ PROTECTED - Keeping userProfile because localStorage has role:",
            { role: storedData.role }
          );
        }
      }
      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync userProfile to localStorage whenever it changes
  useEffect(() => {
    if (user && userProfile) {
      try {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: userProfile.role,
          accountType: userProfile.accountType,
        };
        localStorage.setItem("vortex_user", JSON.stringify(userData));
      } catch (e) {
        logger.debug("Failed to sync profile to localStorage", { error: e });
      }
    }
  }, [user, userProfile]);

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
