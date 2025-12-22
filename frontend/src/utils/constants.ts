// API Endpoints
export const API_ENDPOINTS = {
  USERS: {
    ME: '/api/users/me',
    VERSIONS: '/api/users/versions',
  },
  PLANS: {
    BASE: '/api/plans',
    BY_ID: (id: string) => `/api/plans/${id}`,
  },
  BUDGETS: {
    BASE: '/api/budgets',
    BY_ID: (id: string) => `/api/budgets/${id}`,
  },
  ASSETS: {
    BASE: '/api/assets',
    BY_ID: (id: string) => `/api/assets/${id}`,
  },
  DEBTS: {
    BASE: '/api/debts',
    BY_ID: (id: string) => `/api/debts/${id}`,
  },
} as const;

// Default URLs - Lambda API Gateway endpoints
// Development: Local Lambda or API Gateway
// eslint-disable-next-line no-undef
export const DEFAULT_API_URL_DEV = (typeof process !== 'undefined' && process.env?.['VITE_API_URL_DEV']) || 'http://localhost:5000';
// Production: API Gateway endpoint (set via environment variable)
// eslint-disable-next-line no-undef
export const DEFAULT_API_URL_PROD = (typeof process !== 'undefined' && process.env?.['VITE_API_URL_PROD']) || 'https://5m78zqlfve.execute-api.us-east-1.amazonaws.com/prod';

// Local Storage
export const STORAGE_PREFIX = 'budget_app_';
export const SYNC_METADATA_KEY = 'sync_metadata';