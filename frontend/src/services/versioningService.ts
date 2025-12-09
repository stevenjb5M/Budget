// Versioning and offline storage service
import { budgetsAPI, plansAPI } from '../api/client'
import { STORAGE_PREFIX, SYNC_METADATA_KEY } from '../utils/constants'
interface VersionedData<T> {
  data: T
  version: number
  lastModified: string
  lastSynced?: string
  userId: string
}

interface SyncMetadata {
  lastSyncAttempt: string
  lastSuccessfulSync?: string
  pendingChanges: boolean
  userId: string
}

class VersioningService {
  private readonly STORAGE_PREFIX = STORAGE_PREFIX
  private readonly SYNC_KEY = SYNC_METADATA_KEY

  // Generic storage methods
  private getStorageKey(entityType: string, userId: string): string {
    return `${this.STORAGE_PREFIX}${entityType}_${userId}`
  }

  private getVersionedData<T>(key: string): VersionedData<T> | null {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  private setVersionedData<T>(key: string, data: VersionedData<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }

  // Sync metadata management
  private getSyncMetadata(userId: string): SyncMetadata | null {
    const key = this.getStorageKey(this.SYNC_KEY, userId)
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading sync metadata:', error)
      return null
    }
  }

  private setSyncMetadata(userId: string, metadata: SyncMetadata): void {
    const key = this.getStorageKey(this.SYNC_KEY, userId)
    try {
      localStorage.setItem(key, JSON.stringify(metadata))
    } catch (error) {
      console.error('Error writing sync metadata:', error)
    }
  }

  // Public API methods
  async getData<T>(
    entityType: string,
    userId: string,
    fetchFromAPI: () => Promise<T>
  ): Promise<T> {
    const storageKey = this.getStorageKey(entityType, userId)
    const localData = this.getVersionedData<T>(storageKey)
    const syncMeta = this.getSyncMetadata(userId)

    // If we have local data and no pending changes, use it
    if (localData && !syncMeta?.pendingChanges) {
      // Try to sync in background if it's been a while
      if (this.shouldAttemptSync(syncMeta)) {
        this.backgroundSync(entityType, userId, fetchFromAPI)
      }
      return localData.data
    }

    // Otherwise, fetch from API
    try {
      const freshData = await fetchFromAPI()
      this.storeData(entityType, userId, freshData, true) // Mark as from sync
      
      // Clear pending changes since we successfully fetched fresh data
      const syncMeta: SyncMetadata = {
        lastSyncAttempt: new Date().toISOString(),
        lastSuccessfulSync: new Date().toISOString(),
        pendingChanges: false,
        userId
      }
      this.setSyncMetadata(userId, syncMeta)
      
      return freshData
    } catch (error) {
      // If API fails and we have local data, use local data
      if (localData) {
        console.warn('API unavailable, using cached data:', error)
        return localData.data
      }
      throw error
    }
  }

  storeData<T>(entityType: string, userId: string, data: T, fromSync: boolean = false): void {
    const storageKey = this.getStorageKey(entityType, userId)
    const existing = this.getVersionedData<T>(storageKey)

    const versionedData: VersionedData<T> = {
      data,
      version: (existing?.version || 0) + 1,
      lastModified: new Date().toISOString(),
      userId
    }

    this.setVersionedData(storageKey, versionedData)

    // Only mark as having pending changes if this is not from a successful sync
    if (!fromSync) {
      this.markPendingChanges(userId)
    }
  }

  async syncData<T>(
    entityType: string,
    userId: string,
    syncToAPI: (data: T) => Promise<any>
  ): Promise<void> {
    const storageKey = this.getStorageKey(entityType, userId)
    const localData = this.getVersionedData<T>(storageKey)

    if (!localData) return

    try {
      await syncToAPI(localData.data)

      // Update sync metadata
      const syncMeta: SyncMetadata = {
        lastSyncAttempt: new Date().toISOString(),
        lastSuccessfulSync: new Date().toISOString(),
        pendingChanges: false,
        userId
      }
      this.setSyncMetadata(userId, syncMeta)

      // Update local data with sync timestamp
      const updatedData = { ...localData, lastSynced: new Date().toISOString() }
      this.setVersionedData(storageKey, updatedData)

    } catch (error) {
      console.error('Sync failed:', error)
      // Update sync metadata with failed attempt
      const syncMeta = this.getSyncMetadata(userId) || {
        lastSyncAttempt: '',
        pendingChanges: true,
        userId
      }
      syncMeta.lastSyncAttempt = new Date().toISOString()
      this.setSyncMetadata(userId, syncMeta)
      throw error
    }
  }

  private markPendingChanges(userId: string): void {
    const syncMeta = this.getSyncMetadata(userId) || {
      lastSyncAttempt: '',
      pendingChanges: false,
      userId
    }
    syncMeta.pendingChanges = true
    this.setSyncMetadata(userId, syncMeta)
  }

  private shouldAttemptSync(syncMeta: SyncMetadata | null): boolean {
    if (!syncMeta?.lastSuccessfulSync) return true

    const lastSync = new Date(syncMeta.lastSuccessfulSync)
    const now = new Date()
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)

    // Attempt sync if it's been more than 1 hour
    return hoursSinceSync > 1
  }

  private async backgroundSync<T>(
    entityType: string,
    userId: string,
    fetchFromAPI: () => Promise<T>
  ): Promise<void> {
    try {
      const freshData = await fetchFromAPI()
      this.storeData(entityType, userId, freshData)
    } catch (error) {
      // Silently fail background sync
      console.debug('Background sync failed:', error)
    }
  }

  // Utility methods
  clearUserData(userId: string): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes(userId)) {
        localStorage.removeItem(key)
      }
    })
  }

  getPendingChangesCount(userId: string): number {
    const syncMeta = this.getSyncMetadata(userId)
    return syncMeta?.pendingChanges ? 1 : 0 // Simplified - could count actual pending items
  }

  isOnline(): boolean {
    return navigator.onLine
  }
}

// Create singleton instance
export const versioningService = new VersioningService()

// Convenience methods for specific entities
export const budgetStorage = {
  getBudgets: (userId: string) => versioningService.getData('budgets', userId, () => budgetsAPI.getBudgets().then(r => r.data)),
  storeBudgets: (userId: string, budgets: any[]) => versioningService.storeData('budgets', userId, budgets),
  syncBudgets: (userId: string) => versioningService.syncData('budgets', userId, (budgets: any[]) => budgetsAPI.updateBudget(budgets[0]?.id, budgets[0])) // Simplified
}

export const planStorage = {
  getPlans: (userId: string) => versioningService.getData('plans', userId, () => plansAPI.getPlans().then(r => r.data)),
  storePlans: (userId: string, plans: any[]) => versioningService.storeData('plans', userId, plans),
  syncPlans: (userId: string) => versioningService.syncData('plans', userId, (plans: any[]) => plansAPI.updatePlan(plans[0]?.id, plans[0])) // Simplified
}