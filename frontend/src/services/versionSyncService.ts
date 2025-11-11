// Advanced version-based synchronization service
import { budgetsAPI, plansAPI, assetsAPI, debtsAPI, usersAPI } from '../api/client'
import { getCurrentUserId } from '../utils/auth'

interface LocalVersions {
  globalVersion: number
  budgetsVersion: number
  plansVersion: number
  assetsVersion: number
  debtsVersion: number
  lastSync: string
}

interface VersionedData<T> {
  data: T
  version: number
  lastModified: string
  userId: string
}

class VersionSyncService {
  private readonly STORAGE_PREFIX = 'budget_app_versions_'
  private readonly DATA_PREFIX = 'budget_app_data_'

  // Version management
  private getVersionsKey(userId: string): string {
    return `${this.STORAGE_PREFIX}${userId}`
  }

  private getDataKey(entityType: string, userId: string): string {
    return `${this.DATA_PREFIX}${entityType}_${userId}`
  }

  private getLocalVersions(userId: string): LocalVersions | null {
    try {
      const stored = localStorage.getItem(this.getVersionsKey(userId))
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading local versions:', error)
      return null
    }
  }

  private setLocalVersions(userId: string, versions: LocalVersions): void {
    try {
      localStorage.setItem(this.getVersionsKey(userId), JSON.stringify(versions))
    } catch (error) {
      console.error('Error storing local versions:', error)
    }
  }

  private getVersionedData<T>(key: string): VersionedData<T> | null {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading versioned data:', error)
      return null
    }
  }

  private setVersionedData<T>(key: string, data: VersionedData<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error storing versioned data:', error)
    }
  }

  // Main sync method - checks versions and syncs only what's changed
  async syncData(): Promise<void> {
    try {
      const userId = await getCurrentUserId()

      // Get server versions
      const serverVersions = await usersAPI.getUserVersions()

      // Get local versions
      const localVersions = this.getLocalVersions(userId)

      if (!localVersions) {
        // First time sync - get all data
        await this.fullSync(userId)
        return
      }

      // Selective sync based on version differences
      const syncPromises: Promise<void>[] = []

      if (serverVersions.data.budgetsVersion > localVersions.budgetsVersion) {
        syncPromises.push(this.syncBudgets(userId))
      }

      if (serverVersions.data.plansVersion > localVersions.plansVersion) {
        syncPromises.push(this.syncPlans(userId))
      }

      if (serverVersions.data.assetsVersion > localVersions.assetsVersion) {
        syncPromises.push(this.syncAssets(userId))
      }

      if (serverVersions.data.debtsVersion > localVersions.debtsVersion) {
        syncPromises.push(this.syncDebts(userId))
      }

      await Promise.all(syncPromises)

      // Update local versions
      this.setLocalVersions(userId, {
        globalVersion: serverVersions.data.globalVersion,
        budgetsVersion: serverVersions.data.budgetsVersion,
        plansVersion: serverVersions.data.plansVersion,
        assetsVersion: serverVersions.data.assetsVersion,
        debtsVersion: serverVersions.data.debtsVersion,
        lastSync: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error during version sync:', error)
      throw error
    }
  }

  // Full sync for first-time users
  private async fullSync(userId: string): Promise<void> {
    const [budgets, plans, assets, debts, serverVersions] = await Promise.all([
      budgetsAPI.getBudgets(),
      plansAPI.getPlans(),
      assetsAPI.getAssets(),
      debtsAPI.getDebts(),
      usersAPI.getUserVersions()
    ])

    // Store all data locally
    this.setVersionedData(this.getDataKey('budgets', userId), {
      data: budgets.data,
      version: serverVersions.data.budgetsVersion,
      lastModified: new Date().toISOString(),
      userId
    })

    this.setVersionedData(this.getDataKey('plans', userId), {
      data: plans.data,
      version: serverVersions.data.plansVersion,
      lastModified: new Date().toISOString(),
      userId
    })

    this.setVersionedData(this.getDataKey('assets', userId), {
      data: assets.data,
      version: serverVersions.data.assetsVersion,
      lastModified: new Date().toISOString(),
      userId
    })

    this.setVersionedData(this.getDataKey('debts', userId), {
      data: debts.data,
      version: serverVersions.data.debtsVersion,
      lastModified: new Date().toISOString(),
      userId
    })

    // Store local versions
    this.setLocalVersions(userId, {
      globalVersion: serverVersions.data.globalVersion,
      budgetsVersion: serverVersions.data.budgetsVersion,
      plansVersion: serverVersions.data.plansVersion,
      assetsVersion: serverVersions.data.assetsVersion,
      debtsVersion: serverVersions.data.debtsVersion,
      lastSync: new Date().toISOString()
    })
  }

  // Selective sync methods
  private async syncBudgets(userId: string): Promise<void> {
    const budgets = await budgetsAPI.getBudgets()
    this.setVersionedData(this.getDataKey('budgets', userId), {
      data: budgets.data,
      version: budgets.data.reduce((max: number, b: any) => Math.max(max, b.version || 1), 1),
      lastModified: new Date().toISOString(),
      userId
    })
  }

  private async syncPlans(userId: string): Promise<void> {
    const plans = await plansAPI.getPlans()
    this.setVersionedData(this.getDataKey('plans', userId), {
      data: plans.data,
      version: plans.data.reduce((max: number, p: any) => Math.max(max, p.version || 1), 1),
      lastModified: new Date().toISOString(),
      userId
    })
  }

  private async syncAssets(userId: string): Promise<void> {
    const assets = await assetsAPI.getAssets()
    this.setVersionedData(this.getDataKey('assets', userId), {
      data: assets.data,
      version: assets.data.reduce((max: number, a: any) => Math.max(max, a.version || 1), 1),
      lastModified: new Date().toISOString(),
      userId
    })
  }

  private async syncDebts(userId: string): Promise<void> {
    const debts = await debtsAPI.getDebts()
    this.setVersionedData(this.getDataKey('debts', userId), {
      data: debts.data,
      version: debts.data.reduce((max: number, d: any) => Math.max(max, d.version || 1), 1),
      lastModified: new Date().toISOString(),
      userId
    })
  }

  // Get data with cache-first approach
  async getData<T>(entityType: string, fetchFromServer: () => Promise<T>): Promise<T> {
    try {
      const userId = await getCurrentUserId()
      const key = this.getDataKey(entityType, userId)
      const cached = this.getVersionedData<T>(key)

      if (cached) {
        // Return cached data immediately
        // TODO: Trigger background sync if needed
        return cached.data
      }

      // No cache, fetch from server
      const data = await fetchFromServer()
      this.setVersionedData(key, {
        data,
        version: 1, // Initial version
        lastModified: new Date().toISOString(),
        userId
      })

      return data
    } catch (error) {
      console.error(`Error getting ${entityType} data:`, error)
      // Fallback to server if cache fails
      return await fetchFromServer()
    }
  }

  // Store data locally (called after successful server operations)
  storeData<T>(entityType: string, userId: string, data: T, version?: number): void {
    const key = this.getDataKey(entityType, userId)
    this.setVersionedData(key, {
      data,
      version: version || 1,
      lastModified: new Date().toISOString(),
      userId
    })
  }
}

export const versionSyncService = new VersionSyncService()