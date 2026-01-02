import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  getBudgetsHandler,
  createBudgetHandler,
  updateBudgetHandler,
  deleteBudgetHandler,
} from './budgets';

vi.mock('../services/dynamodbService', () => {
  const mockGetUserBudgets = vi.fn();
  const mockCreateBudget = vi.fn();
  const mockGetBudget = vi.fn();
  const mockUpdateBudget = vi.fn();
  const mockDeleteBudget = vi.fn();
  return {
    default: {
      getUserBudgets: mockGetUserBudgets,
      createBudget: mockCreateBudget,
      getBudget: mockGetBudget,
      updateBudget: mockUpdateBudget,
      deleteBudget: mockDeleteBudget,
    },
    mockGetUserBudgets,
    mockCreateBudget,
    mockGetBudget,
    mockUpdateBudget,
    mockDeleteBudget,
  };
});

const createEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => ({
  httpMethod: 'GET',
  path: '/budgets',
  headers: {},
  body: null,
  requestContext: {
    authorizer: {
      claims: {
        sub: 'user-123',
      },
    },
  } as any,
  ...overrides,
});

describe('Budgets Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBudgetsHandler', () => {
    it('should return budgets for authorized user', async () => {
      const { mockGetUserBudgets } = await import('../services/dynamodbService');
      const budgets = [
        { id: 'budget-1', name: 'Monthly', isActive: true },
        { id: 'budget-2', name: 'Yearly', isActive: false },
      ];
      mockGetUserBudgets.mockResolvedValue(budgets);

      const response = await getBudgetsHandler(createEvent());

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(budgets);
      expect(mockGetUserBudgets).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 when no authorization', async () => {
      const event = createEvent({
        requestContext: {
          authorizer: {
            claims: { sub: undefined },
          },
        } as any,
      });

      const response = await getBudgetsHandler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on database error', async () => {
      const { mockGetUserBudgets } = await import('../services/dynamodbService');
      mockGetUserBudgets.mockRejectedValue(new Error('Database error'));

      const response = await getBudgetsHandler(createEvent());

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });

    it('should return empty array when user has no budgets', async () => {
      const { mockGetUserBudgets } = await import('../services/dynamodbService');
      mockGetUserBudgets.mockResolvedValue([]);

      const response = await getBudgetsHandler(createEvent());

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([]);
    });
  });

  describe('createBudgetHandler', () => {
    it('should create budget with required fields', async () => {
      const { mockCreateBudget } = await import('../services/dynamodbService');
      const newBudget = { id: 'budget-1', userId: 'user-123', name: 'Monthly', isActive: true };
      mockCreateBudget.mockResolvedValue(newBudget);

      const response = await createBudgetHandler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({ name: 'Monthly', isActive: true }),
        })
      );

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(newBudget);
      expect(mockCreateBudget).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Monthly',
        isActive: true,
        income: [],
        expenses: [],
      });
    });

    it('should create budget with optional income and expenses', async () => {
      const { mockCreateBudget } = await import('../services/dynamodbService');
      const newBudget = {
        id: 'budget-1',
        userId: 'user-123',
        name: 'Monthly',
        isActive: true,
        income: [{ id: 'inc-1', amount: 5000 }],
        expenses: [{ id: 'exp-1', amount: 1000 }],
      };
      mockCreateBudget.mockResolvedValue(newBudget);

      const response = await createBudgetHandler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({
            name: 'Monthly',
            isActive: true,
            income: [{ id: 'inc-1', amount: 5000 }],
            expenses: [{ id: 'exp-1', amount: 1000 }],
          }),
        })
      );

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(newBudget);
      expect(mockCreateBudget).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Monthly',
        isActive: true,
        income: [{ id: 'inc-1', amount: 5000 }],
        expenses: [{ id: 'exp-1', amount: 1000 }],
      });
    });

    it('should return 400 when missing name field', async () => {
      const response = await createBudgetHandler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({ isActive: true }),
        })
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Missing required fields');
      expect(body.details.missingFields).toContain('name');
    });

    it('should return 400 when missing isActive field', async () => {
      const response = await createBudgetHandler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({ name: 'Monthly' }),
        })
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Missing required fields');
      expect(body.details.missingFields).toContain('isActive');
    });

    it('should return 401 when not authorized', async () => {
      const event = createEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ name: 'Monthly', isActive: true }),
        requestContext: {
          authorizer: {
            claims: { sub: undefined },
          },
        } as any,
      });

      const response = await createBudgetHandler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on database error', async () => {
      const { mockCreateBudget } = await import('../services/dynamodbService');
      mockCreateBudget.mockRejectedValue(new Error('Database error'));

      const response = await createBudgetHandler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({ name: 'Monthly', isActive: true }),
        })
      );

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });
  });

  describe('updateBudgetHandler', () => {
    it('should update budget for authorized user', async () => {
      const { mockGetBudget, mockUpdateBudget } = await import('../services/dynamodbService');
      const existingBudget = { id: 'budget-1', userId: 'user-123', name: 'Monthly', isActive: true };
      const updated = { ...existingBudget, name: 'Updated' };
      mockGetBudget.mockResolvedValue(existingBudget);
      mockUpdateBudget.mockResolvedValue(updated);

      const response = await updateBudgetHandler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'budget-1' },
          body: JSON.stringify({ name: 'Updated' }),
        })
      );

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(updated);
      expect(mockUpdateBudget).toHaveBeenCalledWith('budget-1', { name: 'Updated' });
    });

    it('should remove protected fields during update', async () => {
      const { mockGetBudget, mockUpdateBudget } = await import('../services/dynamodbService');
      const existingBudget = { id: 'budget-1', userId: 'user-123', name: 'Monthly', isActive: true };
      mockGetBudget.mockResolvedValue(existingBudget);
      mockUpdateBudget.mockResolvedValue(existingBudget);

      await updateBudgetHandler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'budget-1' },
          body: JSON.stringify({
            name: 'Updated',
            userId: 'different-user',
            id: 'different-id',
            planId: 'plan-1',
            version: 2,
            createdAt: '2025-01-01',
          }),
        })
      );

      const updateCall = (await import('../services/dynamodbService')).mockUpdateBudget.mock.calls[0][1];
      expect(updateCall.userId).toBeUndefined();
      expect(updateCall.id).toBeUndefined();
      expect(updateCall.planId).toBeUndefined();
      expect(updateCall.version).toBeUndefined();
      expect(updateCall.createdAt).toBeUndefined();
      expect(updateCall.name).toBe('Updated');
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await updateBudgetHandler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: undefined,
          body: JSON.stringify({ name: 'Updated' }),
        })
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Budget ID is required');
    });

    it('should return 404 when budget not found', async () => {
      const { mockGetBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockResolvedValue(null);

      const response = await updateBudgetHandler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'budget-1' },
          body: JSON.stringify({ name: 'Updated' }),
        })
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error).toBe('Budget not found');
    });

    it('should return 404 when budget belongs to different user', async () => {
      const { mockGetBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockResolvedValue({
        id: 'budget-1',
        userId: 'different-user',
        name: 'Monthly',
      });

      const response = await updateBudgetHandler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'budget-1' },
          body: JSON.stringify({ name: 'Updated' }),
        })
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error).toBe('Budget not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'budget-1' },
        body: JSON.stringify({ name: 'Updated' }),
        requestContext: {
          authorizer: {
            claims: { sub: undefined },
          },
        } as any,
      });

      const response = await updateBudgetHandler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on database error', async () => {
      const { mockGetBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockRejectedValue(new Error('Database error'));

      const response = await updateBudgetHandler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'budget-1' },
          body: JSON.stringify({ name: 'Updated' }),
        })
      );

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });
  });

  describe('deleteBudgetHandler', () => {
    it('should delete budget for authorized user', async () => {
      const { mockGetBudget, mockDeleteBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockResolvedValue({
        id: 'budget-1',
        userId: 'user-123',
        name: 'Monthly',
      });
      mockDeleteBudget.mockResolvedValue(undefined);

      const response = await deleteBudgetHandler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: { id: 'budget-1' },
        })
      );

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('Budget deleted successfully');
      expect(mockDeleteBudget).toHaveBeenCalledWith('budget-1');
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await deleteBudgetHandler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: undefined,
        })
      );

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe('Budget ID is required');
    });

    it('should return 404 when budget not found', async () => {
      const { mockGetBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockResolvedValue(null);

      const response = await deleteBudgetHandler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: { id: 'budget-1' },
        })
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error).toBe('Budget not found');
    });

    it('should return 404 when budget belongs to different user', async () => {
      const { mockGetBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockResolvedValue({
        id: 'budget-1',
        userId: 'different-user',
        name: 'Monthly',
      });

      const response = await deleteBudgetHandler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: { id: 'budget-1' },
        })
      );

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error).toBe('Budget not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'budget-1' },
        requestContext: {
          authorizer: {
            claims: { sub: undefined },
          },
        } as any,
      });

      const response = await deleteBudgetHandler(event);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on database error', async () => {
      const { mockGetBudget } = await import('../services/dynamodbService');
      mockGetBudget.mockRejectedValue(new Error('Database error'));

      const response = await deleteBudgetHandler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: { id: 'budget-1' },
        })
      );

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });
  });
});
