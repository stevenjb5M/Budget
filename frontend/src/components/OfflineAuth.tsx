import React, { useState } from 'react';
import { localAuth } from '../services/localAuth';
import './OfflineAuth.css';

interface OfflineAuthProps {
  onSignIn: (userId: string) => void;
}

export function OfflineAuth({ onSignIn }: OfflineAuthProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await localAuth.signIn(username || 'User');
      onSignIn(user.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await localAuth.autoSignIn();
      onSignIn(user.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="offline-auth-container">
      <div className="offline-auth-card">
        <h1 className="offline-auth-title">Budget Planner</h1>
        <p className="offline-auth-subtitle">Offline Mode</p>

        <form onSubmit={handleSubmit} className="offline-auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your name (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="auth-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          onClick={handleQuickSignIn}
          disabled={loading}
          className="quick-signin-button"
        >
          Continue as Guest
        </button>

        <div className="info-box">
          <p>
            💾 <strong>Offline Mode:</strong> All data is stored locally in your browser. No internet required!
          </p>
        </div>
      </div>
    </div>
  );
}
