import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getDebtsHandler, createDebtHandler, updateDebtHandler, deleteDebtHandler } from './debts';
import dynamodbService from '../services/dynamodbService';
import { Debt } from '../types';

vi.mock('../services/dynamodbService');

const mockDynamodbService = dynamodbService as any;

const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => {
  return {
    httpMethod: 'GET',
    path: '/debts',
    headers: {},
    body: null,
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123',
          email: 'test@example.com',
          'cognito:username': 'testuser',
        },
      } as any,
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent;
};

const mockDebt: Debt = {
  id: 'debt-123',
  userId: 'test-user-123',
  name: 'Credit Card',
  currentBalance: 5000,
  interestRate: 0.18,
  minimumPayment: 150,
  notes: 'Chase Sapphire',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Debts Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDebtsHandler', () => {
    it('should return user debts on success', async () => {
      const mockDebts = [mockDebt];
      mockDynamodbService.getUserDebts.mockResolvedValue(mockDebts);

      const event = createMockEvent();
      const result = await getDebtsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockDebts);
      expect(mockDynamodbService.getUserDebts).toHaveBeenCalledWith('test-user-123');
    });

    it('should return empty array when no debts exist', async () => {
      mockDynamodbService.getUserDebts.mockResolvedValue([]);

      const event = createMockEvent();
      const result = await getDebtsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual([]);
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await getDebtsHandler(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toBe('Unauthorized access');
      expect(mockDynamodbService.getUserDebts).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDynamodbService.getUserDebts.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent();
      const result = await getDebtsHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });

    it('should return multiple debts', async () => {
      const mockDebts = [
        mockDebt,
        {
          ...mockDebt,
          id: 'debt-456',
          name: 'Student Loan',
          currentBalance: 50000,
          interestRate: 0.045,
          minimumPayment: 300,
        },
      ];
      mockDynamodbService.getUserDebts.mockResolvedValue(mockDebts);

      const event = createMockEvent();
      const result = await getDebtsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveLength(2);
    });
  });

  describe('createDebtHandler', () => {
    it('should create debt with valid input', async () => {
      const createPayload = {
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
        notes: 'Car loan',
      };

      const createdDebt = {
        ...mockDebt,
        ...createPayload,
      };

      mockDynamodbService.createDebt.mockResolvedValue(createdDebt);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(createdDebt);
      expect(mockDynamodbService.createDebt).toHaveBeenCalledWith({
        userId: 'test-user-123',
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
        notes: 'Car loan',
      });
    });

    it('should create debt without optional notes field', async () => {
      const createPayload = {
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
      };

      mockDynamodbService.createDebt.mockResolvedValue(mockDebt);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(201);
      expect(mockDynamodbService.createDebt).toHaveBeenCalledWith({
        userId: 'test-user-123',
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
        notes: undefined,
      });
    });

    it('should return 400 when missing required field: name', async () => {
      const createPayload = {
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.error).toBe('Missing required fields');
      expect(parsedBody.details.missingFields).toContain('name');
    });

    it('should return 400 when missing required field: currentBalance', async () => {
      const createPayload = {
        name: 'Auto Loan',
        interestRate: 0.06,
        minimumPayment: 450,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.details.missingFields).toContain('currentBalance');
    });

    it('should return 400 when missing required field: interestRate', async () => {
      const createPayload = {
        name: 'Auto Loan',
        currentBalance: 25000,
        minimumPayment: 450,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.details.missingFields).toContain('interestRate');
    });

    it('should return 400 when missing required field: minimumPayment', async () => {
      const createPayload = {
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.details.missingFields).toContain('minimumPayment');
    });

    it('should return 401 when not authorized', async () => {
      const createPayload = {
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockDynamodbService.createDebt).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const createPayload = {
        name: 'Auto Loan',
        currentBalance: 25000,
        interestRate: 0.06,
        minimumPayment: 450,
      };

      mockDynamodbService.createDebt.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createDebtHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('updateDebtHandler', () => {
    it('should update debt successfully', async () => {
      const updatePayload = {
        name: 'Updated Debt',
        currentBalance: 4000,
      };

      const updatedDebt = {
        ...mockDebt,
        ...updatePayload,
      };

      mockDynamodbService.getDebt.mockResolvedValue(mockDebt);
      mockDynamodbService.updateDebt.mockResolvedValue(updatedDebt);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'debt-123' },
        body: JSON.stringify(updatePayload),
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updatedDebt);
      expect(mockDynamodbService.updateDebt).toHaveBeenCalledWith('debt-123', updatePayload);
    });

    it('should strip protected fields from update', async () => {
      const updatePayload = {
        name: 'Updated',
        id: 'debt-999',
        userId: 'other-user',
        version: 2,
        createdAt: '2024-01-02T00:00:00Z',
      };

      mockDynamodbService.getDebt.mockResolvedValue(mockDebt);
      mockDynamodbService.updateDebt.mockResolvedValue(mockDebt);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'debt-123' },
        body: JSON.stringify(updatePayload),
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(200);
      expect(mockDynamodbService.updateDebt).toHaveBeenCalledWith('debt-123', { name: 'Updated' });
    });

    it('should return 400 when debt ID is missing', async () => {
      const updatePayload = { name: 'Updated' };

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: undefined,
        body: JSON.stringify(updatePayload),
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Debt ID is required');
    });

    it('should return 404 when debt not found', async () => {
      mockDynamodbService.getDebt.mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'nonexistent' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Debt not found');
    });

    it('should return 404 when debt belongs to different user', async () => {
      const otherUserDebt = {
        ...mockDebt,
        userId: 'other-user-456',
      };

      mockDynamodbService.getDebt.mockResolvedValue(otherUserDebt);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'debt-123' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Debt not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'debt-123' },
        body: JSON.stringify({ name: 'Updated' }),
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockDynamodbService.getDebt).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDynamodbService.getDebt.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'debt-123' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const result = await updateDebtHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('deleteDebtHandler', () => {
    it('should delete debt successfully', async () => {
      mockDynamodbService.getDebt.mockResolvedValue(mockDebt);
      mockDynamodbService.deleteDebt.mockResolvedValue(undefined);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'debt-123' },
      });

      const result = await deleteDebtHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toBe('Debt deleted successfully');
      expect(mockDynamodbService.deleteDebt).toHaveBeenCalledWith('debt-123');
    });

    it('should return 400 when debt ID is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: undefined,
      });

      const result = await deleteDebtHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Debt ID is required');
    });

    it('should return 404 when debt not found', async () => {
      mockDynamodbService.getDebt.mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'nonexistent' },
      });

      const result = await deleteDebtHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Debt not found');
    });

    it('should return 404 when debt belongs to different user', async () => {
      const otherUserDebt = {
        ...mockDebt,
        userId: 'other-user-456',
      };

      mockDynamodbService.getDebt.mockResolvedValue(otherUserDebt);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'debt-123' },
      });

      const result = await deleteDebtHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Debt not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'debt-123' },
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await deleteDebtHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockDynamodbService.getDebt).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDynamodbService.getDebt.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'debt-123' },
      });

      const result = await deleteDebtHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });
});
