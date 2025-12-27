import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Nav } from './Nav'
import { useAuth } from '../utils/auth'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  NavLink: ({ to, children, className }: any) => (
    <a href={to} className={typeof className === 'function' ? '' : className} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  ),
}))

// Mock useAuth
vi.mock('../utils/auth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  updateUserAttributes: vi.fn(),
}))

// Mock usersAPI
vi.mock('../api/client', () => ({
  usersAPI: {
    getCurrentUser: vi.fn(),
    updateCurrentUser: vi.fn(),
  },
}))

// Mock CSS
vi.mock('./Nav.css', () => ({}))

describe('Nav Component', () => {
  const mockUser = {
    attributes: {
      name: 'Test User',
      email: 'test@example.com',
    },
  }
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    })
  })

  it('renders navigation links', () => {
    render(<Nav />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Assets & Debts')).toBeInTheDocument()
    expect(screen.getByText('Budgets')).toBeInTheDocument()
    expect(screen.getByText('Financial Forecaster')).toBeInTheDocument()
  })

  it('renders user section when user is present', () => {
    render(<Nav />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('renders user email when name is not available', () => {
    mockUseAuth.mockReturnValue({
      user: { attributes: { email: 'test@example.com' } },
      signOut: mockSignOut,
    })

    render(<Nav />)

    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('opens settings modal when settings button is clicked', () => {
    render(<Nav />)

    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)

    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
  })

  it('closes settings modal when cancel is clicked', () => {
    render(<Nav />)

    // Open modal
    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)

    // Close modal
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
  })

  it('fetches user data when settings modal opens', async () => {
    const { usersAPI } = await import('../api/client')
    const mockGetCurrentUser = vi.fn().mockResolvedValue({
      data: {
        displayName: 'Test Display Name',
        birthdayString: '1990-01-01T00:00:00Z',
        retirementAge: 70,
      },
    })
    vi.mocked(usersAPI.getCurrentUser).mockImplementation(mockGetCurrentUser)

    render(<Nav />)

    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled()
    })

    // Check if form is populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Display Name')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('70')).toBeInTheDocument()
    })
  })

  it('handles fetch user error gracefully', async () => {
    const { usersAPI } = await import('../api/client')
    const mockGetCurrentUser = vi.fn().mockRejectedValue(new Error('Fetch failed'))
    vi.mocked(usersAPI.getCurrentUser).mockImplementation(mockGetCurrentUser)

    render(<Nav />)

    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalled()
    })

    // Form should still render, but inputs should be empty or defaults
    const displayNameInput = screen.getByPlaceholderText('Enter your display name')
    const birthdayInput = screen.getByPlaceholderText('YYYY-MM-DD')
    const retirementAgeInput = screen.getByPlaceholderText('65')

    expect(displayNameInput).toBeInTheDocument()
    expect(displayNameInput).toHaveValue('')
    expect(birthdayInput).toHaveValue('')
    expect(retirementAgeInput).toHaveValue(65)
  })

  it('saves user data successfully', async () => {
    const { usersAPI } = await import('../api/client')
    const mockUpdateCurrentUser = vi.fn().mockResolvedValue({})
    const mockUpdateUserAttributes = vi.fn().mockResolvedValue({})
    const mockDispatchEvent = vi.fn()

    vi.mocked(usersAPI.updateCurrentUser).mockImplementation(mockUpdateCurrentUser)
    const { updateUserAttributes } = await import('aws-amplify/auth')
    vi.mocked(updateUserAttributes).mockImplementation(mockUpdateUserAttributes)

    // Mock window.dispatchEvent
    Object.defineProperty(window, 'dispatchEvent', {
      writable: true,
      value: mockDispatchEvent,
    })

    render(<Nav />)

    // Open modal
    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)

    // Fill form
    const displayNameInput = screen.getByPlaceholderText('Enter your display name')
    const birthdayInput = screen.getByPlaceholderText('YYYY-MM-DD')
    const retirementAgeInput = screen.getByPlaceholderText('65')

    fireEvent.change(displayNameInput, { target: { value: 'New Name' } })
    fireEvent.change(birthdayInput, { target: { value: '1995-05-05' } })
    fireEvent.change(retirementAgeInput, { target: { value: '75' } })

    // Save
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
        displayName: 'New Name',
        birthdayString: '1995-05-05',
        retirementAge: 75,
      })
      expect(mockUpdateUserAttributes).toHaveBeenCalledWith({
        userAttributes: { name: 'New Name' },
      })
      expect(mockDispatchEvent).toHaveBeenCalled()
    })

    // Modal should close
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
  })

  it('handles save/update errors gracefully', async () => {
    const { usersAPI } = await import('../api/client')
    const mockUpdateCurrentUser = vi.fn().mockRejectedValue(new Error('Update failed'))
    const mockUpdateUserAttributes = vi.fn().mockRejectedValue(new Error('Auth update failed'))
    vi.mocked(usersAPI.updateCurrentUser).mockImplementation(mockUpdateCurrentUser)
    const { updateUserAttributes } = await import('aws-amplify/auth')
    vi.mocked(updateUserAttributes).mockImplementation(mockUpdateUserAttributes)

    render(<Nav />)

    // Open modal
    const settingsButton = screen.getByTitle('Settings')
    fireEvent.click(settingsButton)

    // Fill form
    const displayNameInput = screen.getByPlaceholderText('Enter your display name')
    const birthdayInput = screen.getByPlaceholderText('YYYY-MM-DD')
    const retirementAgeInput = screen.getByPlaceholderText('65')

    fireEvent.change(displayNameInput, { target: { value: 'New Name' } })
    fireEvent.change(birthdayInput, { target: { value: '1995-05-05' } })
    fireEvent.change(retirementAgeInput, { target: { value: '75' } })

    // Save and expect errors to be handled without closing modal
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalled()
    })

    // After error, modal should still be open and save button text reverted
    await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument())
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
  })

  it('calls signOut when sign out button is clicked', () => {
    render(<Nav />)

    const signOutButton = screen.getByText('Sign Out')
    fireEvent.click(signOutButton)

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('does not render user section when no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    render(<Nav />)

    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
  })
})