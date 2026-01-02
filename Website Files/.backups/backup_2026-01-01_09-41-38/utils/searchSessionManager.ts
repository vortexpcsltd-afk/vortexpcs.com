/**
 * Search Session Manager
 * Generates and maintains session IDs for tracking user search journeys
 */

const SESSION_KEY = "vortex_search_session";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  sessionId: string;
  lastActivity: number;
  searchCount: number;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create a search session ID
 * Sessions expire after 30 minutes of inactivity
 */
export function getSearchSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();

    if (stored) {
      const session: SessionData = JSON.parse(stored);

      // Check if session is still valid
      if (now - session.lastActivity < SESSION_TIMEOUT) {
        // Update activity and increment search count
        session.lastActivity = now;
        session.searchCount++;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session.sessionId;
      }
    }

    // Create new session
    const newSession: SessionData = {
      sessionId: generateSessionId(),
      lastActivity: now,
      searchCount: 1,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return newSession.sessionId;
  } catch {
    // Fallback to timestamp-based ID if storage fails
    return `session_${Date.now()}`;
  }
}

/**
 * Get current session info (for debugging)
 */
export function getSessionInfo(): SessionData | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Clear current session (useful for testing)
 */
export function clearSearchSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Silently fail if storage not available
  }
}
