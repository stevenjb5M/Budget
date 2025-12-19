/**
 * Storage initialization and factory for offline-mode
 */

import { IndexedDBStore } from './indexeddb';
import { IDataStore } from './types';
import { SampleDataGenerator } from './sampleData';

let globalStore: IDataStore | null = null;
let isInitialized = false;

/**
 * Initialize the local storage system
 * Loads sample data on first run
 */
export async function initializeStorage(): Promise<IDataStore> {
  if (globalStore && isInitialized) {
    return globalStore;
  }

  const store = new IndexedDBStore();
  await store.isReady();

  // Check if we have data already
  const existingUsers = await store.all('users');

  if (existingUsers.length === 0) {
    // First run - populate with sample data
    console.log('First run detected. Populating with sample data...');
    await populateSampleData(store);
  }

  globalStore = store;
  isInitialized = true;

  return store;
}

/**
 * Get the global storage instance
 */
export function getStorage(): IDataStore {
  if (!globalStore) {
    throw new Error(
      'Storage not initialized. Call initializeStorage() first.'
    );
  }
  return globalStore;
}

/**
 * Reset storage to factory defaults
 */
export async function resetStorage(): Promise<void> {
  if (globalStore) {
    await globalStore.clearAll();
  }
  isInitialized = false;

  // Reinitialize with sample data
  await initializeStorage();
}

/**
 * Populate storage with sample data
 */
async function populateSampleData(store: IDataStore): Promise<void> {
  const data = SampleDataGenerator.generateCompleteDataset();

  // Store user
  await store.put('users', data.user);

  // Store plans
  for (const plan of data.plans) {
    await store.put('plans', plan);
  }

  // Store assets
  for (const asset of data.assets) {
    await store.put('assets', asset);
  }

  // Store debts
  for (const debt of data.debts) {
    await store.put('debts', debt);
  }

  // Store budgets
  for (const budget of data.budgets) {
    await store.put('budgets', budget);
  }

  // Store transactions
  for (const transaction of data.transactions) {
    await store.put('transactions', transaction);
  }

  console.log('Sample data populated successfully');
}
