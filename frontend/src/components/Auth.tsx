import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import React, { useEffect, useState } from 'react'
import { AuthProps } from '../types'
import { AuthContext } from '../utils/auth'
import { OfflineAuth } from './OfflineAuth'
import './Auth.css'

export function AuthProvider({ children, signOut, user }: { children: React.ReactNode, signOut: (() => void) | undefined, user: any }) {
  const [currentUser, setCurrentUser] = useState(user)

  useEffect(() => {
    const fetchAttributes = () => {
      if (user) {
        // Try to get current authenticated user attributes
        import('aws-amplify/auth').then(({ fetchUserAttributes }) => {
          fetchUserAttributes().then((attributes) => {
            // Create a new user object with the attributes
            const userWithAttributes = {
              ...user,
              attributes: attributes
            }
            setCurrentUser(userWithAttributes)
          }).catch(() => {
            setCurrentUser(user)
          })
        }).catch(() => {
          setCurrentUser(user)
        })
      }
    }

    if (user) {
      // If user object doesn't have attributes, try to fetch them
      if (!user.attributes) {
        fetchAttributes()
      } else {
        setCurrentUser(user)
      }
    }

    // Listen for user update events to refresh attributes
    const handleUserUpdate = () => {
      fetchAttributes()
    }
    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user: currentUser, signOut: signOut || (() => {}) }}>
      {children}
    </AuthContext.Provider>
  )
}

// Helper function to auto-fill form fields
function autoFillTestCredentials() {
  const testEmail = 'stevenjbrown95@gmail.com'
  const testPassword = 'Happy123!'
  const testName = 'Steven Brown'
  const testBirthdate = '2001-09-05'  // Must be in YYYY-MM-DD format for date inputs

  // Find all input fields on the page
  const emailInputs = document.querySelectorAll('input[type="email"], input[placeholder*="email" i]')
  const passwordInputs = document.querySelectorAll('input[type="password"]')
  const textInputs = document.querySelectorAll('input[type="text"]')
  const dateInputs = document.querySelectorAll('input[type="date"]')

  // Fill email fields
  emailInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    inputElement.value = testEmail
    inputElement.dispatchEvent(new Event('input', { bubbles: true }))
    inputElement.dispatchEvent(new Event('change', { bubbles: true }))
  })

  // Also fill inputs with "enter your email" or "enter your username" placeholder (for sign-in field)
  const allInputs = document.querySelectorAll('input')
  allInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    const placeholder = inputElement.placeholder?.toLowerCase() || ''
    if ((placeholder === 'enter your email' || placeholder === 'enter your username') && inputElement.type !== 'password') {
      inputElement.value = testEmail
      inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      inputElement.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })

  // Fill password fields
  passwordInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    inputElement.value = testPassword
    inputElement.dispatchEvent(new Event('input', { bubbles: true }))
    inputElement.dispatchEvent(new Event('change', { bubbles: true }))
  })

  // Fill name and text fields (look for name or username placeholder)
  textInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    const placeholder = inputElement.placeholder?.toLowerCase() || ''
    
    if (placeholder === 'name' || placeholder.includes('full name')) {
      inputElement.value = testName
      inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      inputElement.dispatchEvent(new Event('change', { bubbles: true }))
    } else if (placeholder === 'username') {
      inputElement.value = testEmail
      inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      inputElement.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })

  // Fill date fields
  dateInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    inputElement.value = testBirthdate
    inputElement.dispatchEvent(new Event('input', { bubbles: true }))
    inputElement.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

export function Auth({ children }: AuthProps) {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineUser, setOfflineUser] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    // Check if we're in offline mode by checking if storage is initialized
    const checkOfflineMode = async () => {
      try {
        const { getStorage } = await import('../services/storage');
        try {
          getStorage();
          // If we get here, storage is initialized - we're in offline mode
          setIsOfflineMode(true);
          
          // Check if user is already signed in
          const { localAuth: auth } = await import('../services/localAuth');
          const user = auth.getCurrentUser();
          if (user && user.isAuthenticated) {
            setOfflineUser({ userId: user.userId, userName: user.username });
          }
        } catch {
          // Storage not initialized yet or not in offline mode
          setIsOfflineMode(false);
        }
      } catch {
        setIsOfflineMode(false);
      }
    };

    checkOfflineMode();

    // Add keyboard listener for hotkey
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        autoFillTestCredentials();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOfflineSignIn = (userId: string) => {
    setOfflineUser({ userId, userName: 'User' });
  };

  const handleOfflineSignOut = () => {
    import('../services/localAuth').then(({ localAuth: auth }) => auth.signOut());
    setOfflineUser(null);
  };

  // Offline mode authentication
  if (isOfflineMode) {
    if (!offlineUser) {
      return <OfflineAuth onSignIn={handleOfflineSignIn} />;
    }

    // User is signed in, create context and render app
    return (
      <AuthContext.Provider value={{ 
        user: { username: offlineUser.userName, attributes: { sub: offlineUser.userId } },
        signOut: handleOfflineSignOut
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Regular Cognito authentication
  return (
    <div className="auth-container">
      <div className="auth-card">
        <Authenticator
          signUpAttributes={['email', 'name', 'birthdate']}
          formFields={{
            signUp: {
              email: {
                label: 'Email',
                placeholder: 'Enter your email',
                isRequired: true,
              },
              name: {
                label: 'Full Name',
                placeholder: 'Enter your full name',
                isRequired: true,
              },
              birthdate: {
                label: 'Date of Birth',
                placeholder: 'YYYY-MM-DD',
                isRequired: true,
                type: 'date',
              },
              password: {
                label: 'Password',
                placeholder: 'Enter your password',
                isRequired: true,
              },
              confirm_password: {
                label: 'Confirm Password',
                placeholder: 'Confirm your password',
                isRequired: true,
              },
            },
            signIn: {
              username: {
                label: 'Email',
                placeholder: 'Enter your email',
              },
              password: {
                label: 'Password',
                placeholder: 'Enter your password',
              },
            },
          }}
          components={{
            Header: () => (
              <div className="auth-header">
                <h1 className="auth-title">Budget Planner</h1>
                <p className="auth-subtitle">Sign in to manage your finances</p>
              </div>
            ),
          }}
        >
          {({ signOut, user }) => (
            <AuthProvider signOut={signOut} user={user}>
              {children}
            </AuthProvider>
          )}
        </Authenticator>
      </div>
    </div>
  );
}

export default Auth