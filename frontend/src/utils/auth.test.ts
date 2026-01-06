import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUserId, getCurrentUserIdSync, setCurrentUserId } from '../utils/auth'
import { fetchAuthSession } from 'aws-amplify/auth'

// Mock AWS Amplify
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn()
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('auth utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage if available
    try {
      localStorage.clear()
    } catch (e) {
      // localStorage might not be available in test environment
    }
  })

  describe('getCurrentUserId', () => {
    it('should return userSub when available', async () => {
      const mockSession = {
        userSub: 'test-user-sub',
        tokens: null
      }
      ;(fetchAuthSession as any).mockResolvedValue(mockSession)

      const result = await getCurrentUserId()

      expect(result).toBe('test-user-sub')
      expect(fetchAuthSession).toHaveBeenCalledTimes(1)
    })

    it('should return idToken sub when userSub is not available', async () => {
      const mockSession = {
        userSub: null,
        tokens: {
          idToken: {
            payload: {
              sub: 'id-token-sub'
            }
          }
        }
      }
      ;(fetchAuthSession as any).mockResolvedValue(mockSession)

      const result = await getCurrentUserId()

      expect(result).toBe('id-token-sub')
    })

    it('should return anonymous-user on error', async () => {
      ;(fetchAuthSession as any).mockRejectedValue(new Error('Auth error'))

      const result = await getCurrentUserId()

      expect(result).toBe('anonymous-user')
    })
  })

  describe('getCurrentUserIdSync', () => {
    it('should return cached user ID from localStorage', () => {
      localStorage.setItem('budget_app_current_user_id', 'cached-user-id')

      const result = getCurrentUserIdSync()

      expect(result).toBe('cached-user-id')
    })

    it('should return anonymous-user when no cache exists', () => {
      const result = getCurrentUserIdSync()

      expect(result).toBe('anonymous-user')
    })

    it('should return anonymous-user on localStorage error', () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem')
      mockGetItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = getCurrentUserIdSync()

      expect(result).toBe('anonymous-user')
      mockGetItem.mockRestore()
    })
  })

  describe('setCurrentUserId', () => {
    it('should set user ID in localStorage', () => {
      setCurrentUserId('test-user-id')

      expect(localStorage.getItem('budget_app_current_user_id')).toBe('test-user-id')
    })

    it('should handle localStorage errors gracefully', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
      mockSetItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => setCurrentUserId('test-user-id')).not.toThrow()
      mockSetItem.mockRestore()
    })
  })
})