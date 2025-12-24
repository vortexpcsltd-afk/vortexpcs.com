/**
 * Safe Storage Utilities
 * Provides wrapped access to localStorage and sessionStorage with proper error handling
 * for cases where storage is unavailable (private browsing, quota exceeded, etc.)
 */

/**
 * Safely get a value from localStorage
 * Returns null if localStorage is unavailable or key doesn't exist
 */
export function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // localStorage may be disabled in private browsing mode, quota exceeded, etc.
    // Use centralized logger; debug only in development to reduce noise
    try {
      void import("../services/logger")
        .then(({ logger }) => {
          logger.debug(`Failed to get localStorage[${key}]`, { error });
        })
        .catch(() => {
          void 0;
        });
    } catch {
      void 0;
    }
    return null;
  }
}

/**
 * Safely set a value in localStorage
 * Returns true if successful, false if storage is unavailable
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // QuotaExceededError, SecurityError, or other storage access errors
    try {
      void import("../services/logger")
        .then(({ logger }) => {
          logger.debug(`Failed to set localStorage[${key}]`, { error });
        })
        .catch(() => {
          void 0;
        });
    } catch {
      void 0;
    }
    return false;
  }
}

/**
 * Safely remove a value from localStorage
 * Returns true if successful, false if storage is unavailable
 */
export function safeRemoveLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    try {
      void import("../services/logger")
        .then(({ logger }) => {
          logger.debug(`Failed to remove localStorage[${key}]`, { error });
        })
        .catch(() => {
          void 0;
        });
    } catch {
      void 0;
    }
    return false;
  }
}

/**
 * Safely get a value from sessionStorage
 * Returns null if sessionStorage is unavailable or key doesn't exist
 */
export function safeGetSessionStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    try {
      void import("../services/logger")
        .then(({ logger }) => {
          logger.debug(`Failed to get sessionStorage[${key}]`, { error });
        })
        .catch(() => {
          void 0;
        });
    } catch {
      void 0;
    }
    return null;
  }
}

/**
 * Safely set a value in sessionStorage
 * Returns true if successful, false if storage is unavailable
 */
export function safeSetSessionStorage(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    try {
      void import("../services/logger")
        .then(({ logger }) => {
          logger.debug(`Failed to set sessionStorage[${key}]`, { error });
        })
        .catch(() => {
          void 0;
        });
    } catch {
      void 0;
    }
    return false;
  }
}

/**
 * Safely remove a value from sessionStorage
 * Returns true if successful, false if storage is unavailable
 */
export function safeRemoveSessionStorage(key: string): boolean {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    try {
      void import("../services/logger")
        .then(({ logger }) => {
          logger.debug(`Failed to remove sessionStorage[${key}]`, { error });
        })
        .catch(() => {
          void 0;
        });
    } catch {
      void 0;
    }
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
