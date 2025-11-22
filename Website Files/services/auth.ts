/**
 * Firebase Authentication Service
 * Handles user authentication, registration, and session management
 */

import type { User, UserCredential } from "firebase/auth";
import { auth, googleProvider, db } from "../config/firebase";
import { logger } from "./logger";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  accountType?: "general" | "business";
  accountNumber?: string;
  phone?: string;
  address?: string;
  marketingOptOut?: boolean; // true means user opted out of marketing emails
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
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { createUserWithEmailAndPassword, updateProfile } = await import(
      "firebase/auth"
    );
    const { doc, setDoc } = await import("firebase/firestore");

    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update user profile
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      accountType: "general",
      marketingOptOut: false,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    // Assign unique account number via serverless API (idempotent)
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch("/api/users/assign-account-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid, accountType: "general" }),
      });
      if (!resp.ok) {
        const msg = await resp.text();
        logger.warn("Account number assignment failed", {
          status: resp.status,
          msg,
        });
      }
    } catch (e) {
      logger.warn("Account number assignment error", { err: String(e) });
    }

    return user;
  } catch (error: unknown) {
    logger.error("Registration error:", error);

    // Parse Firebase error codes and return user-friendly messages
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    switch (errorCode) {
      case "auth/email-already-in-use":
        throw new Error(
          "This email is already registered. Please login instead."
        );
      case "auth/invalid-email":
        throw new Error("Invalid email address. Please check and try again.");
      case "auth/weak-password":
        throw new Error(
          "Password is too weak. Please use at least 6 characters."
        );
      case "auth/operation-not-allowed":
        throw new Error(
          "Email/password accounts are not enabled. Please contact support."
        );
      case "auth/network-request-failed":
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      default:
        throw new Error("Registration failed. Please try again.");
    }
  }
};

/**
 * Sign in with email and password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  if (!auth || !db) {
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const { doc, getDoc, setDoc, updateDoc } = await import(
      "firebase/firestore"
    );

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Check if user document exists, create if not
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist (role defaults to 'user')
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || email.split("@")[0],
          accountType: "general",
          role: "user",
          marketingOptOut: false,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        await setDoc(userDocRef, userProfile);
      } else {
        // Update last login if document exists
        await updateDoc(userDocRef, {
          lastLogin: new Date(),
        });
      }
    } catch (profileError) {
      // Log but don't fail login if profile update fails
      logger.warn("Failed to update user profile on login", {
        error: String(profileError),
      });
    }

    return user;
  } catch (error: unknown) {
    logger.error("Login error:", error);

    // Parse Firebase error codes and return user-friendly messages
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    // Log the actual error for debugging
    console.error("[Auth] Login failed with error code:", errorCode);
    console.error("[Auth] Full error:", error);

    switch (errorCode) {
      case "auth/invalid-email":
        throw new Error("Invalid email address. Please check and try again.");
      case "auth/user-disabled":
        throw new Error(
          "This account has been disabled. Please contact support."
        );
      case "auth/user-not-found":
        throw new Error("Incorrect email. Please try again.");
      case "auth/wrong-password":
        throw new Error("Incorrect password. Please try again.");
      case "auth/invalid-credential":
        throw new Error("Incorrect email or password. Please try again.");
      case "auth/too-many-requests":
        throw new Error(
          "Too many failed login attempts. Please try again later."
        );
      case "auth/network-request-failed":
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      case "permission-denied":
        throw new Error(
          "Permission denied. Your account may not be properly set up. Please contact support."
        );
      default: {
        // Include error code in message for debugging
        const debugMessage = errorCode
          ? `Login failed (${errorCode}). Please check your credentials and try again.`
          : "Login failed. Please check your credentials and try again.";
        throw new Error(debugMessage);
      }
    }
  }
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  if (!auth || !googleProvider || !db) {
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { signInWithPopup } = await import("firebase/auth");
    const { doc, setDoc, getDoc } = await import("firebase/firestore");

    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // Create new user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || "User",
        accountType: "general",
        marketingOptOut: false,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      // Assign unique account number via serverless API (idempotent)
      try {
        const idToken = await user.getIdToken();
        const resp = await fetch("/api/users/assign-account-number", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid: user.uid, accountType: "general" }),
        });
        if (!resp.ok) {
          const msg = await resp.text();
          logger.warn("Account number assignment failed", {
            status: resp.status,
            msg,
          });
        }
      } catch (e) {
        logger.warn("Account number assignment error", { err: String(e) });
      }
    } else {
      // Update last login
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date(),
      });
    }

    return user;
  } catch (error: unknown) {
    logger.error("Google login error:", error);

    // Parse Firebase error codes and return user-friendly messages
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    switch (errorCode) {
      case "auth/popup-closed-by-user":
        throw new Error("Sign-in was cancelled. Please try again.");
      case "auth/popup-blocked":
        throw new Error("Pop-up blocked. Please allow pop-ups and try again.");
      case "auth/account-exists-with-different-credential":
        throw new Error(
          "An account already exists with this email. Please use a different sign-in method."
        );
      case "auth/network-request-failed":
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      default:
        throw new Error("Google sign-in failed. Please try again.");
    }
  }
};

/**
 * Log out current user
 */
export const logoutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  } catch (error: unknown) {
    logger.error("Logout error:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Failed to log out";
    throw new Error(errorMessage);
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    logger.error("Password reset error:", error);

    // Parse Firebase error codes and return user-friendly messages
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    switch (errorCode) {
      case "auth/invalid-email":
        throw new Error("Invalid email address. Please check and try again.");
      case "auth/user-not-found":
        throw new Error("No account found with this email address.");
      case "auth/network-request-failed":
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      default:
        throw new Error(
          "Failed to send password reset email. Please try again."
        );
    }
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  if (!db) {
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    return null;
  } catch (error: unknown) {
    // Check for permission-denied error
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    if (errorCode === "permission-denied") {
      logger.warn(
        "Permission denied reading user profile - may need to create profile",
        { uid }
      );
      return null; // Return null instead of throwing to allow graceful handling
    }

    logger.error("Get user profile error:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Failed to get user profile";
    throw new Error(errorMessage);
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
    throw new Error(
      "Firebase not initialized. Please configure Firebase to use authentication."
    );
  }

  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "users", uid), updates);
  } catch (error: unknown) {
    logger.error("Update user profile error:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Failed to update user profile";
    throw new Error(errorMessage);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  if (!auth) {
    logger.warn("Firebase auth not initialized");
    return null;
  }
  return auth.currentUser;
};

/**
 * Change the current user's password (requires recent login)
 */
export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  if (!auth) throw new Error("Firebase not initialized");
  const user = auth.currentUser;
  if (!user || !user.email)
    throw new Error("No authenticated user to update password");

  try {
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } =
      await import("firebase/auth");
    // Reauthenticate with email/password
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  } catch (error: unknown) {
    logger.error("Change password error:", error);
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;
    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        throw new Error("Current password is incorrect.");
      case "auth/weak-password":
        throw new Error(
          "Password too weak. Use at least 6 characters and try again."
        );
      case "auth/requires-recent-login":
        throw new Error("Please log in again and then change your password.");
      default:
        throw new Error("Failed to change password. Please try again.");
    }
  }
};

/**
 * Change the current user's email. Sends a verification link to the new email.
 * Requires recent login. Firestore email will be updated after verification on next sync.
 */
export const changeUserEmail = async (
  currentPassword: string,
  newEmail: string
): Promise<void> => {
  if (!auth) throw new Error("Firebase not initialized");
  const user = auth.currentUser;
  if (!user || !user.email)
    throw new Error("No authenticated user to update email");

  try {
    const {
      EmailAuthProvider,
      reauthenticateWithCredential,
      verifyBeforeUpdateEmail,
    } = await import("firebase/auth");
    // Reauthenticate
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await verifyBeforeUpdateEmail(user, newEmail);
  } catch (error: unknown) {
    logger.error("Change email error:", error);
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;
    switch (code) {
      case "auth/invalid-email":
        throw new Error("Invalid email address. Please check and try again.");
      case "auth/email-already-in-use":
        throw new Error("This email is already in use by another account.");
      case "auth/requires-recent-login":
        throw new Error("Please log in again and then change your email.");
      case "auth/wrong-password":
      case "auth/invalid-credential":
        throw new Error("Current password is incorrect.");
      default:
        throw new Error("Failed to start email change. Please try again.");
    }
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  if (!auth) {
    logger.warn("Firebase auth not initialized");
    // Call callback immediately with null user and return a no-op unsubscribe function
    setTimeout(() => callback(null), 0);
    return () => {};
  }

  // We need to return the unsubscribe function synchronously, but we're doing async import
  // So we'll use a wrapper
  let unsubscribe: (() => void) | null = null;

  import("firebase/auth")
    .then(({ onAuthStateChanged: firebaseOnAuthStateChanged }) => {
      unsubscribe = firebaseOnAuthStateChanged(auth!, callback);
    })
    .catch((error) => {
      logger.error("Error loading Firebase auth:", error);
      callback(null);
    });

  // Return an unsubscribe function that calls the real one when available
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};
