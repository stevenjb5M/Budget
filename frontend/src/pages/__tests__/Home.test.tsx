import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home } from '../Home'
import { useDashboard } from '../../hooks/useDashboard'

// Mock the custom hook
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}))

// Mock the Nav component
vi.mock('../../components/Nav', () => ({
  Nav: () => <nav data-testid="nav">Navigation</nav>,
}))

// Mock the Footer component
vi.mock('../../components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}))

// Mock CSS
vi.mock('./Home.css', () => ({}))

describe('Home Component', () => {
  const mockUseDashboard = vi.mocked(useDashboard)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDashboardData = {
    user: {
      id: '1',
      displayName: 'John Doe',
      email: 'john@example.com',
      birthdayString: '1990-01-01',
      retirementAge: 65,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
    assets: [],
    debts: [],
    assetsTotal: 50000,
    debtsTotal: 25000,
    netWorth: 25000,
    age: 34,
  }

  it('renders loading state', () => {
    mockUseDashboard.mockReturnValue({
      dashboardData: mockDashboardData,
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<Home />)

    expect(screen.getByTestId('nav')).toBeInTheDocument()
    // Loading state should be present
  })

  it('renders error state', () => {
    mockUseDashboard.mockReturnValue({
      dashboardData: mockDashboardData,
      loading: false,
      error: 'Failed to load data',
      refetch: vi.fn(),
    })

    render(<Home />)

    expect(screen.getByText(/Error:/)).toBeInTheDocument()
    expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
  })

  it('renders dashboard data correctly', () => {
    mockUseDashboard.mockReturnValue({
      dashboardData: mockDashboardData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<Home />)

    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument()
    expect(screen.getByText("Here's your financial overview for today.")).toBeInTheDocument()
    expect(screen.getByText('Date & Age')).toBeInTheDocument()
    expect(screen.getByText('Total Assets')).toBeInTheDocument()
    expect(screen.getByText('$50,000.00')).toBeInTheDocument() // Assets total
    expect(screen.getByText('Total Debts')).toBeInTheDocument()
    expect(screen.getAllByText('$25,000.00')[0]).toBeInTheDocument() // Debts total (first occurrence)
    expect(screen.getAllByText('Net Worth')[1]).toBeInTheDocument() // Net worth label (second occurrence)
    expect(screen.getAllByText('$25,000.00')[1]).toBeInTheDocument() // Net worth amount (second occurrence)
    expect(screen.getByText('34 years old')).toBeInTheDocument()
  })

  it('does not render welcome section when no user', () => {
    mockUseDashboard.mockReturnValue({
      dashboardData: { ...mockDashboardData, user: null },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<Home />)

    expect(screen.queryByText(/Welcome back/)).not.toBeInTheDocument()
  })

  it('formats currency correctly', () => {
    mockUseDashboard.mockReturnValue({
      dashboardData: {
        ...mockDashboardData,
        assetsTotal: 1234567.89,
        debtsTotal: 987654.32,
        netWorth: 246913.57,
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<Home />)

    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
    expect(screen.getByText('$987,654.32')).toBeInTheDocument()
    expect(screen.getByText('$246,913.57')).toBeInTheDocument()
  })
})