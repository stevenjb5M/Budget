// Enhanced Versioning Service with Multiple Strategies
import { budgetsAPI, plansAPI, assetsAPI, debtsAPI } from '../api/client'

interface VersionMetadata {
  version: number
  lastModified: string
  lastSynced?: string
  checksum: string
  userId: string
}

interface SyncQueueItem {
  id: string
  entityType: string
  entityId: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: string
  retryCount: number
}

class EnhancedVersioningService {
  private readonly STORAGE_PREFIX = 'budget_v2_'
  private readonly QUEUE_KEY = 'sync_queue'

  // Strategy 1: Simple Cache-First with Background Sync
  async getDataWithCache<T>(
    entityType: string,
    userId: string,
    fetchFromAPI: () => Promise<T>,
    cacheDuration = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> {
    const cacheKey = this.getStorageKey(entityType, userId)
    const cached = this.getCachedData<T>(cacheKey)

    if (cached && !this.isCacheExpired(cached, cacheDuration)) {
      // Background refresh if cache is getting old
      if (this.shouldBackgroundRefresh(cached, cacheDuration)) {
        this.backgroundRefresh(entityType, userId, fetchFromAPI)
      }
      return cached.data
    }

    try {
      const freshData = await fetchFromAPI()
      this.setCachedData(cacheKey, freshData, userId)
      return freshData
    } catch (error) {
      if (cached) {
        console.warn('API failed, using stale cache:', error)
        return cached.data
      }
      throw error
    }
  }

  // Strategy 2: Optimistic Updates with Conflict Resolution
  async optimisticUpdate<T>(
    entityType: string,
    entityId: string,
    userId: string,
    updateFn: (currentData: T) => T,
    syncFn: (updatedData: T) => Promise<any>
  ): Promise<T> {
    const cacheKey = this.getStorageKey(entityType, userId)
    const currentData = this.getCachedData<T>(cacheKey)?.data

    if (!currentData) {
      throw new Error('No cached data available for optimistic update')
    }

    // Apply optimistic update immediately
    const optimisticData = updateFn(currentData)
    this.setCachedData(cacheKey, optimisticData, userId)

    // Queue for sync
    this.addToSyncQueue({
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      operation: 'update',
      data: optimisticData,
      timestamp: new Date().toISOString(),
      retryCount: 0
    })

    // Attempt sync
    try {
      await syncFn(optimisticData)
      this.removeFromSyncQueue(entityType, entityId)
    } catch (error) {
      console.error('Optimistic update sync failed:', error)
      // Data remains in cache, will be retried later
    }

    return optimisticData
  }

  // Strategy 3: Version-Based Sync with Conflict Resolution
  async versionedSync<T extends { id: string; updatedAt?: string }>(
    entityType: string,
    userId: string,
    localData: T,
    remoteData: T,
    mergeStrategy: 'local-wins' | 'remote-wins' | 'manual' = 'local-wins'
  ): Promise<T> {
    const localVersion = this.getVersionMetadata(entityType, localData.id, userId)
    const remoteVersion = remoteData.updatedAt

    if (!localVersion?.lastSynced) {
      // First sync, use remote data
      return remoteData
    }

    const localTime = new Date(localVersion.lastModified)
    const remoteTime = new Date(remoteVersion || remoteData.updatedAt || '')

    if (localTime > remoteTime) {
      // Local is newer
      return localData
    } else if (remoteTime > localTime) {
      // Remote is newer
      return remoteData
    } else {
      // Same time, use merge strategy
      switch (mergeStrategy) {
        case 'local-wins':
          return localData
        case 'remote-wins':
          return remoteData
        case 'manual':
          // Would trigger UI for manual resolution
          return localData // Default to local for now
        default:
          return localData
      }
    }
  }

  // Strategy 4: Queue-Based Sync with Retry Logic
  async processSyncQueue(userId: string): Promise<void> {
    const queue = this.getSyncQueue(userId)
    const pendingItems = queue.filter(item => item.retryCount < 3)

    for (const item of pendingItems) {
      try {
        await this.syncQueueItem(item)
        this.removeFromSyncQueue(item.entityType, item.entityId)
      } catch (error) {
        console.error(`Sync failed for ${item.entityType}:${item.entityId}:`, error)
        item.retryCount++
        this.updateSyncQueueItem(item)
      }
    }
  }

  private async syncQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.entityType) {
      case 'budgets':
        await budgetsAPI.updateBudget(item.entityId, item.data)
        break
      case 'plans':
        await plansAPI.updatePlan(item.entityId, item.data)
        break
      case 'assets':
        await assetsAPI.updateAsset(item.entityId, item.data)
        break
      case 'debts':
        await debtsAPI.updateDebt(item.entityId, item.data)
        break
      default:
        throw new Error(`Unknown entity type: ${item.entityType}`)
    }
  }

  // Utility Methods
  private getStorageKey(entityType: string, userId: string): string {
    return `${this.STORAGE_PREFIX}${entityType}_${userId}`
  }

  private getCachedData<T>(key: string): { data: T; timestamp: string } | null {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private setCachedData<T>(key: string, data: T, userId: string): void {
    try {
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
        userId
      }
      localStorage.setItem(key, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Cache write failed:', error)
    }
  }

  private isCacheExpired(cached: any, duration: number): boolean {
    const cacheTime = new Date(cached.timestamp)
    const now = new Date()
    return (now.getTime() - cacheTime.getTime()) > duration
  }

  private shouldBackgroundRefresh(cached: any, duration: number): boolean {
    // Refresh if cache is more than half expired
    return this.isCacheExpired(cached, duration / 2)
  }

  private async backgroundRefresh<T>(
    entityType: string,
    userId: string,
    fetchFromAPI: () => Promise<T>
  ): Promise<void> {
    try {
      const freshData = await fetchFromAPI()
      const cacheKey = this.getStorageKey(entityType, userId)
      this.setCachedData(cacheKey, freshData, userId)
    } catch (error) {
      // Silent failure for background refresh
      console.debug('Background refresh failed:', error)
    }
  }

  private getVersionMetadata(entityType: string, entityId: string, userId: string): VersionMetadata | null {
    const key = `${this.STORAGE_PREFIX}metadata_${entityType}_${entityId}_${userId}`
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  private getSyncQueue(userId: string): SyncQueueItem[] {
    const key = this.getStorageKey(this.QUEUE_KEY, userId)
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private addToSyncQueue(item: SyncQueueItem): void {
    const queue = this.getSyncQueue(item.data.userId || '')
    queue.push(item)
    const key = this.getStorageKey(this.QUEUE_KEY, item.data.userId || '')
    localStorage.setItem(key, JSON.stringify(queue))
  }

  private removeFromSyncQueue(entityType: string, entityId: string): void {
    // Implementation would filter out the specific item
    console.log(`Removing ${entityType}:${entityId} from sync queue`)
  }

  private updateSyncQueueItem(item: SyncQueueItem): void {
    // Implementation would update the item in queue
    console.log(`Updating sync queue item:`, item)
  }
}

// Create singleton
export const enhancedVersioningService = new EnhancedVersioningService()

// Usage examples:
/*
// Strategy 1: Cache-First
const budgets = await enhancedVersioningService.getDataWithCache(
  'budgets',
  userId,
  () => budgetsAPI.getBudgets().then(r => r.data)
)

// Strategy 2: Optimistic Updates
const updatedBudget = await enhancedVersioningService.optimisticUpdate(
  'budgets',
  budgetId,
  userId,
  (currentBudgets) => currentBudgets.map(b => b.id === budgetId ? { ...b, name: newName } : b),
  (updatedBudgets) => budgetsAPI.updateBudget(budgetId, updatedBudgets.find(b => b.id === budgetId))
)

// Strategy 3: Version-Based Sync
const mergedData = await enhancedVersioningService.versionedSync(
  'budgets',
  userId,
  localBudget,
  remoteBudget,
  'manual' // Would show UI for conflict resolution
)

// Strategy 4: Queue Processing
await enhancedVersioningService.processSyncQueue(userId)
*/