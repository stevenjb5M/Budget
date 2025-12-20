/**
 * Local authentication service for offline mode
 * Simple session-based auth without Cognito
 */

interface LocalAuthSession {
  userId: string;
  userName: string;
  email: string;
  isSignedIn: boolean;
  signInTime: number;
}

const STORAGE_KEY = 'budget_app_local_auth';

export const localAuth = {
  /**
   * Sign in with a local account
   */
  signIn(email: string, password: string): LocalAuthSession {
    // For offline mode, we accept any email/password combination
    // In a real app, you'd validate credentials against a local database
    
    if (!email || email.length < 3) {
      throw new Error('Please enter a valid email');
    }
    if (!password || password.length < 3) {
      throw new Error('Password must be at least 3 characters');
    }

    const userId = `user-${Date.now()}`;
    const session: LocalAuthSession = {
      userId,
      userName: email.split('@')[0],
      email,
      isSignedIn: true,
      signInTime: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }

    return session;
  },

  /**
   * Sign up (create new local account)
   */
  signUp(email: string, password: string, name: string): LocalAuthSession {
    // Validation
    if (!email || email.length < 3) {
      throw new Error('Please enter a valid email');
    }
    if (!password || password.length < 3) {
      throw new Error('Password must be at least 3 characters');
    }
    if (!name || name.length < 1) {
      throw new Error('Please enter your name');
    }

    const userId = `user-${Date.now()}`;
    const session: LocalAuthSession = {
      userId,
      userName: name,
      email,
      isSignedIn: true,
      signInTime: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }

    return session;
  },

  /**
   * Get current session
   */
  getSession(): LocalAuthSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to read session from localStorage:', error);
    }
    return null;
  },

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    const session = this.getSession();
    return session ? session.isSignedIn : false;
  },

  /**
   * Get current user ID
   */
  getCurrentUserId(): string {
    const session = this.getSession();
    return session?.userId || `user-${Date.now()}`;
  },

  /**
   * Sign out
   */
  signOut(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  },

  /**
   * Get current user attributes
   */
  getUserAttributes() {
    const session = this.getSession();
    if (!session) return null;

    return {
      sub: session.userId,
      email: session.email,
      name: session.userName,
      email_verified: true,
    };
  },
};
