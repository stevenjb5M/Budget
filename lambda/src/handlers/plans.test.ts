import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  getPlansHandler,
  getPlanHandler,
  createPlanHandler,
  updatePlanHandler,
  deletePlanHandler,
} from './plans';

vi.mock('../services/dynamodbService', () => {
  const mockGetUserPlans = vi.fn();
  const mockGetPlan = vi.fn();
  const mockCreatePlan = vi.fn();
  const mockUpdatePlan = vi.fn();
  const mockDeletePlan = vi.fn();
  return {
    default: {
      getUserPlans: mockGetUserPlans,
      getPlan: mockGetPlan,
      createPlan: mockCreatePlan,
      updatePlan: mockUpdatePlan,
      deletePlan: mockDeletePlan,
    },
    mockGetUserPlans,
    mockGetPlan,
    mockCreatePlan,
    mockUpdatePlan,
    mockDeletePlan,
  };
});

const createEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => ({
  httpMethod: 'GET',
  path: '/plans',
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

describe('Plans Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlansHandler', () => {
    it('should return user plans with 200 status', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getUserPlans).mockResolvedValue([
        {
          id: 'plan-1',
          userId: 'user-123',
          name: 'Savings Plan',
          description: 'Save for vacation',
          isActive: true,
          months: [],
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const response = await getPlansHandler(createEvent());

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe('Savings Plan');
    });

    it('should return 401 if user is not authorized', async () => {
      const response = await getPlansHandler(createEvent({
        requestContext: { authorizer: undefined } as any,
      }));

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 500 on service error', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getUserPlans).mockRejectedValue(
        new Error('Database error')
      );

      const response = await getPlansHandler(createEvent());

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('getPlanHandler', () => {
    it('should return a specific plan with 200 status', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      const mockPlan = {
        id: 'plan-1',
        userId: 'user-123',
        name: 'Savings Plan',
        description: 'Save for vacation',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(mockPlan);

      const response = await getPlanHandler(createEvent({
        pathParameters: { id: 'plan-1' },
      }));

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('plan-1');
      expect(body.name).toBe('Savings Plan');
    });

    it('should return 400 if plan ID is missing', async () => {
      const response = await getPlanHandler(createEvent({
        pathParameters: {},
      }));

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Plan ID is required');
    });

    it('should return 404 if plan does not exist', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(null);

      const response = await getPlanHandler(createEvent({
        pathParameters: { id: 'nonexistent' },
      }));

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Plan not found');
    });

    it('should return 404 if plan belongs to different user', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue({
        id: 'plan-1',
        userId: 'different-user',
        name: 'Savings Plan',
        description: '',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await getPlanHandler(createEvent({
        pathParameters: { id: 'plan-1' },
      }));

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 if user is not authorized', async () => {
      const response = await getPlanHandler(createEvent({
        pathParameters: { id: 'plan-1' },
        requestContext: { authorizer: undefined } as any,
      }));

      expect(response.statusCode).toBe(401);
    });
  });

  describe('createPlanHandler', () => {
    it('should create a plan and return 201 status', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      const newPlan = {
        id: 'plan-new',
        userId: 'user-123',
        name: 'New Plan',
        description: 'A new plan',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(dynamodbService.default.createPlan).mockResolvedValue(newPlan);

      const response = await createPlanHandler(createEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ name: 'New Plan', description: 'A new plan' }),
      }));

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('plan-new');
      expect(body.name).toBe('New Plan');
    });

    it('should return 400 if name is missing', async () => {
      const response = await createPlanHandler(createEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ description: 'No name provided' }),
      }));

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Missing required fields');
      expect(body.details.missingFields).toContain('name');
    });

    it('should create plan with default isActive=true', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.createPlan).mockResolvedValue({
        id: 'plan-new',
        userId: 'user-123',
        name: 'New Plan',
        description: '',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await createPlanHandler(createEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ name: 'New Plan' }),
      }));

      const call = vi.mocked(dynamodbService.default.createPlan).mock.calls[0][0];
      expect(call.isActive).toBe(true);
    });

    it('should respect isActive=false when provided', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.createPlan).mockResolvedValue({
        id: 'plan-new',
        userId: 'user-123',
        name: 'New Plan',
        description: '',
        isActive: false,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await createPlanHandler(createEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ name: 'New Plan', isActive: false }),
      }));

      const call = vi.mocked(dynamodbService.default.createPlan).mock.calls[0][0];
      expect(call.isActive).toBe(false);
    });

    it('should return 401 if user is not authorized', async () => {
      const response = await createPlanHandler(createEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ name: 'New Plan' }),
        requestContext: { authorizer: undefined } as any,
      }));

      expect(response.statusCode).toBe(401);
    });
  });

  describe('updatePlanHandler', () => {
    it('should update a plan and return 200 status', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      const existingPlan = {
        id: 'plan-1',
        userId: 'user-123',
        name: 'Old Plan',
        description: 'Old description',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedPlan = { ...existingPlan, name: 'Updated Plan', version: 2 };
      
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(existingPlan);
      vi.mocked(dynamodbService.default.updatePlan).mockResolvedValue(updatedPlan);

      const response = await updatePlanHandler(createEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'plan-1' },
        body: JSON.stringify({ name: 'Updated Plan' }),
      }));

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Plan');
    });

    it('should return 400 if plan ID is missing', async () => {
      const response = await updatePlanHandler(createEvent({
        httpMethod: 'PUT',
        pathParameters: {},
        body: JSON.stringify({ name: 'Updated Plan' }),
      }));

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Plan ID is required');
    });

    it('should return 404 if plan does not exist', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(null);

      const response = await updatePlanHandler(createEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'nonexistent' },
        body: JSON.stringify({ name: 'Updated Plan' }),
      }));

      expect(response.statusCode).toBe(404);
    });

    it('should not allow updating id, userId, version, or createdAt', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      const existingPlan = {
        id: 'plan-1',
        userId: 'user-123',
        name: 'Old Plan',
        description: '',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(existingPlan);
      vi.mocked(dynamodbService.default.updatePlan).mockResolvedValue(existingPlan);

      await updatePlanHandler(createEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'plan-1' },
        body: JSON.stringify({
          name: 'Updated',
          id: 'different-id',
          userId: 'different-user',
          version: 999,
          createdAt: '2000-01-01',
        }),
      }));

      const call = vi.mocked(dynamodbService.default.updatePlan).mock.calls[0][1];
      expect(call.id).toBeUndefined();
      expect(call.userId).toBeUndefined();
      expect(call.version).toBeUndefined();
      expect(call.createdAt).toBeUndefined();
      expect(call.name).toBe('Updated');
    });

    it('should return 401 if user is not authorized', async () => {
      const response = await updatePlanHandler(createEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'plan-1' },
        body: JSON.stringify({ name: 'Updated' }),
        requestContext: { authorizer: undefined } as any,
      }));

      expect(response.statusCode).toBe(401);
    });
  });

  describe('deletePlanHandler', () => {
    it('should delete a plan and return 200 status', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      const existingPlan = {
        id: 'plan-1',
        userId: 'user-123',
        name: 'Plan to Delete',
        description: '',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(existingPlan);
      vi.mocked(dynamodbService.default.deletePlan).mockResolvedValue(undefined);

      const response = await deletePlanHandler(createEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'plan-1' },
      }));

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Plan deleted successfully');
    });

    it('should return 400 if plan ID is missing', async () => {
      const response = await deletePlanHandler(createEvent({
        httpMethod: 'DELETE',
        pathParameters: {},
      }));

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Plan ID is required');
    });

    it('should return 404 if plan does not exist', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue(null);

      const response = await deletePlanHandler(createEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'nonexistent' },
      }));

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 if plan belongs to different user', async () => {
      const dynamodbService = await import('../services/dynamodbService');
      vi.mocked(dynamodbService.default.getPlan).mockResolvedValue({
        id: 'plan-1',
        userId: 'different-user',
        name: 'Other Plan',
        description: '',
        isActive: true,
        months: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await deletePlanHandler(createEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'plan-1' },
      }));

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 if user is not authorized', async () => {
      const response = await deletePlanHandler(createEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'plan-1' },
        requestContext: { authorizer: undefined } as any,
      }));

      expect(response.statusCode).toBe(401);
    });
  });
});
