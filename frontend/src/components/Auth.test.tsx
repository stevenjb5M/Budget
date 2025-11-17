import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Auth, useAuth, AuthProvider } from './Auth'

// Mock AWS Amplify
vi.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children, signUpAttributes, formFields, components }: any) => (
    <div data-testid="authenticator">
      <div>Authenticator Mock</div>
      {children ? children({ signOut: vi.fn(), user: { username: 'testuser' } }) : null}
    </div>
  ),
}))

vi.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: vi.fn(),
  updateUserAttributes: vi.fn(),
}))

// Mock the CSS import
vi.mock('./Auth.css', () => ({}))

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Authenticator component', () => {
    render(<Auth><div>Test Child</div></Auth>)

    expect(screen.getByTestId('authenticator')).toBeInTheDocument()
    expect(screen.getByText('Authenticator Mock')).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    render(<Auth><div>Test Child</div></Auth>)

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('handles keyboard shortcut for auto-fill', () => {
    const mockQuerySelectorAll = vi.fn()
    const mockDispatchEvent = vi.fn()

    // Mock document methods
    Object.defineProperty(document, 'querySelectorAll', {
      writable: true,
      value: mockQuerySelectorAll,
    })

    mockQuerySelectorAll.mockReturnValue([
      { value: '', dispatchEvent: mockDispatchEvent },
    ])

    render(<Auth><div>Test</div></Auth>)

    // Simulate Ctrl+A keydown
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })

    // Check if querySelectorAll was called
    expect(mockQuerySelectorAll).toHaveBeenCalled()
  })
})

describe('AuthProvider', () => {
  const mockUser = { username: 'testuser', attributes: { name: 'Test User' } }
  const mockSignOut = vi.fn()

  it('provides auth context to children', () => {
    const TestComponent = () => {
      const { user, signOut } = useAuth()
      return (
        <div>
          <span>{user?.username}</span>
          <button onClick={signOut}>Sign Out</button>
        </div>
      )
    }

    render(
      <AuthProvider signOut={mockSignOut} user={mockUser}>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('throws error when useAuth is used outside provider', () => {
    const TestComponent = () => {
      useAuth()
      return <div>Test</div>
    }

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')
  })

  it('fetches user attributes when user has no attributes', async () => {
    const { fetchUserAttributes } = await import('aws-amplify/auth')
    const mockFetchUserAttributes = vi.mocked(fetchUserAttributes)
    mockFetchUserAttributes.mockResolvedValue({ name: 'Fetched Name' })

    const userWithoutAttributes = { username: 'testuser' }

    const TestComponent = () => {
      const { user } = useAuth()
      return <div>{user?.attributes?.name || 'No attributes'}</div>
    }

    render(
      <AuthProvider signOut={mockSignOut} user={userWithoutAttributes}>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockFetchUserAttributes).toHaveBeenCalled()
    })
  })
})