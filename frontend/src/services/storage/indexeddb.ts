/**
 * IndexedDB implementation for offline-first local storage
 */

import { IDataStore, StorageEntity } from './types';

const DB_NAME = 'BudgetPlannerOffline';
const DB_VERSION = 1;

const OBJECT_STORES = [
  'users',
  'plans',
  'budgets',
  'assets',
  'debts',
  'transactions',
] as const;

export class IndexedDBStore implements IDataStore {
  private db: IDBDatabase | null = null;
  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.initializeDB();
  }

  private initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        for (const store of OBJECT_STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      };
    });
  }

  private async ensureReady(): Promise<IDBDatabase> {
    await this.readyPromise;
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    return this.db;
  }

  async isReady(): Promise<boolean> {
    try {
      await this.ensureReady();
      return true;
    } catch {
      return false;
    }
  }

  async get<T extends StorageEntity>(
    entity: string,
    id: string
  ): Promise<T | undefined> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([entity], 'readonly');
      const store = transaction.objectStore(entity);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put<T extends StorageEntity>(
    entity: string,
    data: T
  ): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([entity], 'readwrite');
      const store = transaction.objectStore(entity);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(entity: string, id: string): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([entity], 'readwrite');
      const store = transaction.objectStore(entity);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async query<T extends StorageEntity>(
    entity: string,
    predicate?: (item: T) => boolean
  ): Promise<T[]> {
    const all = await this.all<T>(entity);
    return predicate ? all.filter(predicate) : all;
  }

  async all<T extends StorageEntity>(entity: string): Promise<T[]> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([entity], 'readonly');
      const store = transaction.objectStore(entity);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(entity: string): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([entity], 'readwrite');
      const store = transaction.objectStore(entity);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([...OBJECT_STORES], 'readwrite');
      let completed = 0;

      for (const store of OBJECT_STORES) {
        const request = transaction.objectStore(store).clear();
        request.onsuccess = () => {
          completed++;
          if (completed === OBJECT_STORES.length) resolve();
        };
        request.onerror = () => reject(request.error);
      }
    });
  }
}
