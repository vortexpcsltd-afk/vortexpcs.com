/**
 * Safe Storage Utilities
 * Provides wrapped access to localStorage and sessionStorage with proper error handling
 * for cases where storage is unavailable (private browsing, quota exceeded, etc.)
 *
 * CRITICAL #7 FIX: All errors are now properly logged with context to prevent silent failures
 */

import { handleStorageError } from "./errorHandler";

/**
 * Safely get a value from localStorage
 * Returns null if localStorage is unavailable or key doesn't exist
 * @param key - Storage key to retrieve
 * @returns Value if exists, null if unavailable or error
 */
export function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // localStorage may be disabled in private browsing mode, quota exceeded, etc.
    handleStorageError(error, "read", key);
    return null;
  }
}

/**
 * Safely set a value in localStorage
 * Returns true if successful, false if storage is unavailable
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success status
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // QuotaExceededError, SecurityError, or other storage access errors
    handleStorageError(error, "write", key);
    return false;
  }
}

/**
 * Safely remove a value from localStorage
 * Returns true if successful, false if storage is unavailable
 * @param key - Storage key to remove
 * @returns Success status
 */
export function safeRemoveLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    handleStorageError(error, "remove", key);
    return false;
  }
}

/**
 * Safely get a value from sessionStorage
 * Returns null if sessionStorage is unavailable or key doesn't exist
 * @param key - Storage key to retrieve
 * @returns Value if exists, null if unavailable or error
 */
export function safeGetSessionStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    handleStorageError(error, "read", key);
    return null;
  }
}

/**
 * Safely set a value in sessionStorage
 * Returns true if successful, false if storage is unavailable
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success status
 */
export function safeSetSessionStorage(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    handleStorageError(error, "write", key);
    return false;
  }
}

/**
 * Safely remove a value from sessionStorage
 * Returns true if successful, false if storage is unavailable
 * @param key - Storage key to remove
 * @returns Success status
 */
export function safeRemoveSessionStorage(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    handleStorageError(error, "remove", key);
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
