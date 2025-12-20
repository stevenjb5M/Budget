/**
 * Local authentication service for offline mode
 * Stores user in localStorage
 */

export interface LocalUser {
  userId: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'budget_local_user';
const DEFAULT_USER = {
  userId: 'local-user-1',
  username: 'User',
  email: 'user@example.local',
};

export const localAuth = {
  /**
   * Check if user is already logged in
   */
  isSignedIn(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null;
  },

  /**
   * Get current signed-in user
   */
  getCurrentUser(): LocalUser | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  /**
   * Sign in with local credentials
   */
  async signIn(username: string): Promise<LocalUser> {
    // Simple validation - in offline mode, just accept any username
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }

    const user: LocalUser = {
      ...DEFAULT_USER,
      username: username.trim(),
      isAuthenticated: true,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Auto-sign in if not already signed in
   */
  async autoSignIn(): Promise<LocalUser> {
    if (this.isSignedIn()) {
      const user = this.getCurrentUser();
      if (user) return user;
    }

    // Auto sign in with default user
    return this.signIn(DEFAULT_USER.username, '');
  },
};
