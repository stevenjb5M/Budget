import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { createContext, useContext, useEffect, useState } from 'react'
import './Auth.css'

interface AuthProps {
  children: React.ReactNode
}

interface AuthContextType {
  user: any
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function AuthProvider({ children, signOut, user }: { children: React.ReactNode, signOut: (() => void) | undefined, user: any }) {
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

  // Fill password fields
  let passwordCount = 0
  passwordInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    inputElement.value = testPassword
    inputElement.dispatchEvent(new Event('input', { bubbles: true }))
    inputElement.dispatchEvent(new Event('change', { bubbles: true }))
    passwordCount++
  })

  // Fill name and text fields (look for name placeholder)
  textInputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement
    if (inputElement.placeholder && inputElement.placeholder.toLowerCase().includes('name')) {
      inputElement.value = testName
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
  useEffect(() => {
    // Add keyboard listener for hotkey (Ctrl+Shift+T)
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+T: Auto-fill test credentials
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault()
        autoFillTestCredentials()
        console.log('Test credentials auto-filled. Use Ctrl+Shift+T to fill again.')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
  )
}

export default Auth