// DynamoDB table names
export const TABLES = {
  USERS: process.env.USERS_TABLE || 'Users',
  PLANS: process.env.PLANS_TABLE || 'Plans',
  BUDGETS: process.env.BUDGETS_TABLE || 'Budgets',
  ASSETS: process.env.ASSETS_TABLE || 'Assets',
  DEBTS: process.env.DEBTS_TABLE || 'Debts',
  USER_VERSIONS: process.env.USER_VERSIONS_TABLE || 'UserVersions',
};

// Default values
export const DEFAULTS = {
  INITIAL_VERSION: 1,
  DEFAULT_BIRTHDAY: '1990-01-01',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  USER_NOT_FOUND: 'User not found',
  PLAN_NOT_FOUND: 'Plan not found',
  BUDGET_NOT_FOUND: 'Budget not found',
  ASSET_NOT_FOUND: 'Asset not found',
  DEBT_NOT_FOUND: 'Debt not found',
  UNAUTHORIZED: 'Unauthorized access',
  INTERNAL_ERROR: 'Internal server error',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  METHOD_NOT_ALLOWED: 'Method not allowed',
};
