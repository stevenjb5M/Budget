import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn()
}))

import { getCurrentUserId, getCurrentUserIdSync, setCurrentUserId } from '../../utils/auth'

describe('Auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns user id from fetchAuthSession when available', async () => {
    const mod = await import('aws-amplify/auth')
    vi.mocked(mod.fetchAuthSession).mockResolvedValue({ userSub: 'user-abc-123' })

    const id = await getCurrentUserId()
    expect(id).toBe('user-abc-123')
  })

  it('falls back to anonymous-user on fetch error', async () => {
    const mod = await import('aws-amplify/auth')
    vi.mocked(mod.fetchAuthSession).mockRejectedValue(new Error('no session'))

    const id = await getCurrentUserId()
    expect(id).toBe('anonymous-user')
  })

  it('setCurrentUserId stores and getCurrentUserIdSync reads from localStorage', () => {
    setCurrentUserId('cached-user-1')
    const sync = getCurrentUserIdSync()
    expect(sync).toBe('cached-user-1')
  })
})
