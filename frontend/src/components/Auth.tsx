import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { createContext, useContext } from 'react'
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
  return (
    <AuthContext.Provider value={{ user, signOut: signOut || (() => {}) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function Auth({ children }: AuthProps) {
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