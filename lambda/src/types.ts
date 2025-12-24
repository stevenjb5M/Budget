import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface LambdaRequest {
  event: APIGatewayProxyEvent;
  userId: string;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  birthdayString: string;
  retirementAge: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  description: string;
  isActive: boolean;
  months: Array<{
    month: string;
    budgetId: string | null;
    netWorth: number;
    transactions?: Array<{
      id: string;
      type: 'asset' | 'debt';
      targetId: string;
      amount: number;
      description: string;
      isEditing?: boolean;
    }>;
  }>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  income: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
  }>;
  expenses: Array<{
    id: string;
    name: string;
    amount: number;
    category: string;
    linkedAssetId?: string;
    linkedDebtId?: string;
  }>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  userId: string;
  name: string;
  currentValue: number;
  annualAPY: number;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserVersion {
  id: string;
  userId: string;
  version: number;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ErrorResponse {
  statusCode: number;
  body: string;
}
