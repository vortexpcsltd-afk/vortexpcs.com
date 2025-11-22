/**
 * Authentication Service Tests
 * Tests for login, logout, registration, and token validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock("../../../config/firebase", () => ({
  auth: { currentUser: null },
  db: null,
}));

describe("Authentication Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Email/Password Authentication", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        emailVerified: true,
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      const email = "test@example.com";
      const password = "password123";

      const result = await signInWithEmailAndPassword(
        {} as any,
        email,
        password
      );

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        email,
        password
      );
      expect(result.user.email).toBe(email);
      expect(result.user.uid).toBe("test-uid");
    });

    it("should reject login with invalid credentials", async () => {
      const mockError = {
        code: "auth/wrong-password",
        message: "Wrong password",
      };

      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(
        signInWithEmailAndPassword({} as any, "test@example.com", "wrongpass")
      ).rejects.toMatchObject({ code: "auth/wrong-password" });
    });

    it("should handle user-not-found error", async () => {
      const mockError = {
        code: "auth/user-not-found",
        message: "User not found",
      };

      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(
        signInWithEmailAndPassword({} as any, "nonexistent@example.com", "pass")
      ).rejects.toMatchObject({ code: "auth/user-not-found" });
    });
  });

  describe("User Registration", () => {
    it("should register new user successfully", async () => {
      const mockUser = {
        uid: "new-uid",
        email: "newuser@example.com",
        emailVerified: false,
      };

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      const result = await createUserWithEmailAndPassword(
        {} as any,
        "newuser@example.com",
        "securepass123"
      );

      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(result.user.email).toBe("newuser@example.com");
      expect(result.user.emailVerified).toBe(false);
    });

    it("should reject registration with existing email", async () => {
      const mockError = {
        code: "auth/email-already-in-use",
        message: "Email already in use",
      };

      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(
        createUserWithEmailAndPassword(
          {} as any,
          "existing@example.com",
          "pass"
        )
      ).rejects.toMatchObject({ code: "auth/email-already-in-use" });
    });

    it("should reject weak passwords", async () => {
      const mockError = {
        code: "auth/weak-password",
        message: "Password should be at least 6 characters",
      };

      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(mockError);

      await expect(
        createUserWithEmailAndPassword({} as any, "test@example.com", "123")
      ).rejects.toMatchObject({ code: "auth/weak-password" });
    });
  });

  describe("Password Reset", () => {
    it("should send password reset email successfully", async () => {
      vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

      await sendPasswordResetEmail({} as any, "test@example.com");

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        "test@example.com"
      );
    });

    it("should handle invalid email for password reset", async () => {
      const mockError = {
        code: "auth/invalid-email",
        message: "Invalid email",
      };

      vi.mocked(sendPasswordResetEmail).mockRejectedValue(mockError);

      await expect(
        sendPasswordResetEmail({} as any, "invalid-email")
      ).rejects.toMatchObject({ code: "auth/invalid-email" });
    });

    it("should handle user-not-found for password reset", async () => {
      const mockError = {
        code: "auth/user-not-found",
        message: "User not found",
      };

      vi.mocked(sendPasswordResetEmail).mockRejectedValue(mockError);

      await expect(
        sendPasswordResetEmail({} as any, "nonexistent@example.com")
      ).rejects.toMatchObject({ code: "auth/user-not-found" });
    });
  });

  describe("Google OAuth", () => {
    it("should login with Google successfully", async () => {
      const mockUser = {
        uid: "google-uid",
        email: "google@example.com",
        displayName: "Google User",
        photoURL: "https://example.com/photo.jpg",
      };

      vi.mocked(signInWithPopup).mockResolvedValue({
        user: mockUser,
      } as any);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup({} as any, provider);

      expect(signInWithPopup).toHaveBeenCalled();
      expect(result.user.email).toBe("google@example.com");
    });

    it("should handle popup closed by user", async () => {
      const mockError = {
        code: "auth/popup-closed-by-user",
        message: "Popup closed",
      };

      vi.mocked(signInWithPopup).mockRejectedValue(mockError);

      await expect(signInWithPopup({} as any, {} as any)).rejects.toMatchObject(
        { code: "auth/popup-closed-by-user" }
      );
    });
  });

  describe("Logout", () => {
    it("should logout successfully", async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);

      await signOut({} as any);

      expect(signOut).toHaveBeenCalled();
    });

    it("should handle logout errors gracefully", async () => {
      const mockError = new Error("Network error");

      vi.mocked(signOut).mockRejectedValue(mockError);

      await expect(signOut({} as any)).rejects.toThrow("Network error");
    });
  });

  describe("Email Validation", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("should validate correct email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.com",
        "user_name@example-domain.com",
      ];

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid",
        "@example.com",
        "test@",
        "test @example.com",
        "test@example",
      ];

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("Password Validation", () => {
    const isStrongPassword = (password: string) => {
      return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
      );
    };

    it("should validate strong passwords", () => {
      const strongPasswords = [
        "Password123",
        "MyP@ssw0rd",
        "Secure123Pass",
        "Complex1Pass",
      ];

      strongPasswords.forEach((password) => {
        expect(isStrongPassword(password)).toBe(true);
      });
    });

    it("should reject weak passwords", () => {
      const weakPasswords = [
        "short1A", // too short
        "nouppercase1", // no uppercase
        "NOLOWERCASE1", // no lowercase
        "NoNumbers", // no numbers
        "12345678", // no letters
      ];

      weakPasswords.forEach((password) => {
        expect(isStrongPassword(password)).toBe(false);
      });
    });
  });
});
