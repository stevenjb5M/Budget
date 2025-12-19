/**
 * Storage abstraction layer for offline-first local database
 */

export interface StorageEntity {
  id: string;
  [key: string]: any;
}

export interface IDataStore {
  /**
   * Get a single entity by ID
   */
  get<T extends StorageEntity>(entity: string, id: string): Promise<T | undefined>;

  /**
   * Save an entity (create or update)
   */
  put<T extends StorageEntity>(entity: string, data: T): Promise<void>;

  /**
   * Delete an entity by ID
   */
  delete(entity: string, id: string): Promise<void>;

  /**
   * Query all entities of a type, optionally filtered
   */
  query<T extends StorageEntity>(
    entity: string,
    predicate?: (item: T) => boolean
  ): Promise<T[]>;

  /**
   * Get all entities of a type
   */
  all<T extends StorageEntity>(entity: string): Promise<T[]>;

  /**
   * Clear all data for an entity type
   */
  clear(entity: string): Promise<void>;

  /**
   * Clear all data in the store
   */
  clearAll(): Promise<void>;

  /**
   * Check if store is ready
   */
  isReady(): Promise<boolean>;
}

// Entity types
export interface User extends StorageEntity {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Plan extends StorageEntity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Budget extends StorageEntity {
  id: string;
  planId: string;
  userId: string;
  month: number;
  year: number;
  income: number;
  createdAt: number;
  updatedAt: number;
}

export interface Asset extends StorageEntity {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface Debt extends StorageEntity {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  interestRate: number;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction extends StorageEntity {
  id: string;
  budgetId: string;
  userId: string;
  planId: string;
  name: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  linkedAssetId?: string;
  linkedDebtId?: string;
  createdAt: number;
  updatedAt: number;
}
