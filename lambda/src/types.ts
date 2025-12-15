import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface LambdaRequest {
  event: APIGatewayProxyEvent;
  userId: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  planId: string;
  userId: string;
  name: string;
  amount: number;
  spent: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  userId: string;
  name: string;
  value: number;
  category: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  creditor: string;
  amount: number;
  interestRate: number;
  dueDate: string;
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
