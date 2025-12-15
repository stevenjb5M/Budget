import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPlansHandler, getPlanHandler, createPlanHandler, updatePlanHandler, deletePlanHandler } from '../plans';
import dynamodbService from '../../services/dynamodbService';
import * as auth from '../../middleware/auth';
import { APIGatewayProxyEvent } from 'aws-lambda';

vi.mock('../../services/dynamodbService');
vi.mock('../../middleware/auth');

describe('Plans Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => ({
    httpMethod: 'GET',
    path: '/plans',
    headers: { Authorization: 'Bearer token' },
    body: null,
    isBase64Encoded: false,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    multiValueHeaders: {},
    requestContext: {
      httpMethod: 'GET',
      path: '/plans',
      requestId: 'test-request-id',
      stage: 'test',
      accountId: '123456789',
      apiId: 'api-id',
      identity: { sourceIp: '127.0.0.1' },
    },
    resource: '',
    stageVariables: null,
    ...overrides,
  });

  describe('getPlansHandler', () => {
    it('should return list of plans for authorized user', async () => {
      // Arrange
      const userId = 'user-1';
      const mockPlans = [
        {
          Id: 'plan-1',
          UserId: userId,
          Name: 'Retirement Plan',
          Description: 'Retirement savings',
          RetirementYear: 2050,
          Version: 1,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getPlansByUser).mockResolvedValue(mockPlans);

      const event = createMockEvent({ httpMethod: 'GET', path: '/plans' });

      // Act
      const result = await getPlansHandler(event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockPlans);
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent();

      // Act
      const result = await getPlansHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
    });

    it('should return empty list when user has no plans', async () => {
      // Arrange
      const userId = 'user-1';
      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getPlansByUser).mockResolvedValue([]);

      const event = createMockEvent();

      // Act
      const result = await getPlansHandler(event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual([]);
    });
  });

  describe('getPlanHandler', () => {
    it('should return plan when found', async () => {
      // Arrange
      const userId = 'user-1';
      const planId = 'plan-1';
      const mockPlan = {
        Id: planId,
        UserId: userId,
        Name: 'Retirement Plan',
        Description: 'Retirement savings',
        RetirementYear: 2050,
        Version: 1,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getPlan).mockResolvedValue(mockPlan);

      const event = createMockEvent({
        httpMethod: 'GET',
        path: `/plans/${planId}`,
        pathParameters: { id: planId },
      });

      // Act
      const result = await getPlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockPlan);
    });

    it('should return 404 when plan not found', async () => {
      // Arrange
      const userId = 'user-1';
      const planId = 'missing-plan';

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getPlan).mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'GET',
        path: `/plans/${planId}`,
        pathParameters: { id: planId },
      });

      // Act
      const result = await getPlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toBe('Plan not found');
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/plans/plan-1',
        pathParameters: { id: 'plan-1' },
      });

      // Act
      const result = await getPlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
    });
  });

  describe('createPlanHandler', () => {
    it('should create plan with valid data', async () => {
      // Arrange
      const userId = 'user-1';
      const planData = {
        Name: 'Retirement Plan',
        Description: 'Retirement savings',
        RetirementYear: 2050,
      };

      const createdPlan = {
        Id: 'plan-1',
        UserId: userId,
        ...planData,
        Version: 1,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.createPlan).mockResolvedValue(createdPlan);

      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/plans',
        body: JSON.stringify(planData),
      });

      // Act
      const result = await createPlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(createdPlan);
    });

    it('should return 400 with missing required fields', async () => {
      // Arrange
      const userId = 'user-1';
      const incompleteData = {
        Description: 'Missing name',
        // Missing Name
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);

      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/plans',
        body: JSON.stringify(incompleteData),
      });

      // Act
      const result = await createPlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(400);
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent({
        httpMethod: 'POST',
        path: '/plans',
        body: JSON.stringify({ Name: 'Plan' }),
      });

      // Act
      const result = await createPlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
    });
  });

  describe('updatePlanHandler', () => {
    it('should update plan with valid data', async () => {
      // Arrange
      const userId = 'user-1';
      const planId = 'plan-1';
      const updateData = {
        Name: 'Updated Plan Name',
        RetirementYear: 2055,
      };

      const updatedPlan = {
        Id: planId,
        UserId: userId,
        Name: 'Updated Plan Name',
        Description: 'Retirement savings',
        RetirementYear: 2055,
        Version: 2,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.updatePlan).mockResolvedValue(updatedPlan);

      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/plans/${planId}`,
        pathParameters: { id: planId },
        body: JSON.stringify(updateData),
      });

      // Act
      const result = await updatePlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updatedPlan);
    });

    it('should return 404 when plan not found', async () => {
      // Arrange
      const userId = 'user-1';
      const planId = 'missing-plan';

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.updatePlan).mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/plans/${planId}`,
        pathParameters: { id: planId },
        body: JSON.stringify({ Name: 'Updated' }),
      });

      // Act
      const result = await updatePlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(404);
    });
  });

  describe('deletePlanHandler', () => {
    it('should delete plan successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const planId = 'plan-1';

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.deletePlan).mockResolvedValue(true);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        path: `/plans/${planId}`,
        pathParameters: { id: planId },
      });

      // Act
      const result = await deletePlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(204);
    });

    it('should return 404 when plan not found', async () => {
      // Arrange
      const userId = 'user-1';
      const planId = 'missing-plan';

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.deletePlan).mockResolvedValue(false);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        path: `/plans/${planId}`,
        pathParameters: { id: planId },
      });

      // Act
      const result = await deletePlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(404);
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent({
        httpMethod: 'DELETE',
        path: '/plans/plan-1',
        pathParameters: { id: 'plan-1' },
      });

      // Act
      const result = await deletePlanHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
    });
  });
});
