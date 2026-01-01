import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAssetsHandler, createAssetHandler, updateAssetHandler, deleteAssetHandler } from './assets';
import dynamodbService from '../services/dynamodbService';
import { Asset } from '../types';

vi.mock('../services/dynamodbService');

const mockDynamodbService = dynamodbService as any;

const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => {
  return {
    httpMethod: 'GET',
    path: '/assets',
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

const mockAsset: Asset = {
  id: 'asset-123',
  userId: 'test-user-123',
  name: 'Savings Account',
  currentValue: 5000,
  annualAPY: 0.04,
  notes: 'Emergency fund',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('Assets Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssetsHandler', () => {
    it('should return user assets on success', async () => {
      const mockAssets = [mockAsset];
      mockDynamodbService.getUserAssets.mockResolvedValue(mockAssets);

      const event = createMockEvent();
      const result = await getAssetsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockAssets);
      expect(mockDynamodbService.getUserAssets).toHaveBeenCalledWith('test-user-123');
    });

    it('should return empty array when no assets exist', async () => {
      mockDynamodbService.getUserAssets.mockResolvedValue([]);

      const event = createMockEvent();
      const result = await getAssetsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual([]);
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await getAssetsHandler(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toBe('Unauthorized access');
      expect(mockDynamodbService.getUserAssets).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDynamodbService.getUserAssets.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent();
      const result = await getAssetsHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });

    it('should return multiple assets', async () => {
      const mockAssets = [
        mockAsset,
        {
          ...mockAsset,
          id: 'asset-456',
          name: 'Investment Account',
          currentValue: 25000,
          annualAPY: 0.07,
        },
      ];
      mockDynamodbService.getUserAssets.mockResolvedValue(mockAssets);

      const event = createMockEvent();
      const result = await getAssetsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveLength(2);
    });
  });

  describe('createAssetHandler', () => {
    it('should create asset with valid input', async () => {
      const createPayload = {
        name: 'New Savings',
        currentValue: 1000,
        annualAPY: 0.03,
        notes: 'Test notes',
      };

      const createdAsset = {
        ...mockAsset,
        ...createPayload,
      };

      mockDynamodbService.createAsset.mockResolvedValue(createdAsset);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(createdAsset);
      expect(mockDynamodbService.createAsset).toHaveBeenCalledWith({
        userId: 'test-user-123',
        name: 'New Savings',
        currentValue: 1000,
        annualAPY: 0.03,
        notes: 'Test notes',
      });
    });

    it('should create asset without optional notes field', async () => {
      const createPayload = {
        name: 'New Savings',
        currentValue: 1000,
        annualAPY: 0.03,
      };

      mockDynamodbService.createAsset.mockResolvedValue(mockAsset);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(201);
      expect(mockDynamodbService.createAsset).toHaveBeenCalledWith({
        userId: 'test-user-123',
        name: 'New Savings',
        currentValue: 1000,
        annualAPY: 0.03,
        notes: undefined,
      });
    });

    it('should return 400 when missing required field: name', async () => {
      const createPayload = {
        currentValue: 1000,
        annualAPY: 0.03,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.error).toBe('Missing required fields');
      expect(parsedBody.details.missingFields).toContain('name');
    });

    it('should return 400 when missing required field: currentValue', async () => {
      const createPayload = {
        name: 'New Savings',
        annualAPY: 0.03,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.details.missingFields).toContain('currentValue');
    });

    it('should return 400 when missing required field: annualAPY', async () => {
      const createPayload = {
        name: 'New Savings',
        currentValue: 1000,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.details.missingFields).toContain('annualAPY');
    });

    it('should return 401 when not authorized', async () => {
      const createPayload = {
        name: 'New Savings',
        currentValue: 1000,
        annualAPY: 0.03,
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockDynamodbService.createAsset).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const createPayload = {
        name: 'New Savings',
        currentValue: 1000,
        annualAPY: 0.03,
      };

      mockDynamodbService.createAsset.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createAssetHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('updateAssetHandler', () => {
    it('should update asset successfully', async () => {
      const updatePayload = {
        name: 'Updated Name',
        currentValue: 6000,
      };

      const updatedAsset = {
        ...mockAsset,
        ...updatePayload,
      };

      mockDynamodbService.getAsset.mockResolvedValue(mockAsset);
      mockDynamodbService.updateAsset.mockResolvedValue(updatedAsset);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'asset-123' },
        body: JSON.stringify(updatePayload),
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updatedAsset);
      expect(mockDynamodbService.updateAsset).toHaveBeenCalledWith('asset-123', updatePayload);
    });

    it('should strip protected fields from update', async () => {
      const updatePayload = {
        name: 'Updated',
        id: 'asset-999',
        userId: 'other-user',
        version: 2,
        createdAt: '2024-01-02T00:00:00Z',
      };

      mockDynamodbService.getAsset.mockResolvedValue(mockAsset);
      mockDynamodbService.updateAsset.mockResolvedValue(mockAsset);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'asset-123' },
        body: JSON.stringify(updatePayload),
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(200);
      // Verify protected fields were removed
      expect(mockDynamodbService.updateAsset).toHaveBeenCalledWith('asset-123', { name: 'Updated' });
    });

    it('should return 400 when asset ID is missing', async () => {
      const updatePayload = { name: 'Updated' };

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: undefined,
        body: JSON.stringify(updatePayload),
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Asset ID is required');
    });

    it('should return 404 when asset not found', async () => {
      mockDynamodbService.getAsset.mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'nonexistent' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Asset not found');
    });

    it('should return 404 when asset belongs to different user', async () => {
      const otherUserAsset = {
        ...mockAsset,
        userId: 'other-user-456',
      };

      mockDynamodbService.getAsset.mockResolvedValue(otherUserAsset);

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'asset-123' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Asset not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'asset-123' },
        body: JSON.stringify({ name: 'Updated' }),
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockDynamodbService.getAsset).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDynamodbService.getAsset.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent({
        httpMethod: 'PUT',
        pathParameters: { id: 'asset-123' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const result = await updateAssetHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('deleteAssetHandler', () => {
    it('should delete asset successfully', async () => {
      mockDynamodbService.getAsset.mockResolvedValue(mockAsset);
      mockDynamodbService.deleteAsset.mockResolvedValue(undefined);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'asset-123' },
      });

      const result = await deleteAssetHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toBe('Asset deleted successfully');
      expect(mockDynamodbService.deleteAsset).toHaveBeenCalledWith('asset-123');
    });

    it('should return 400 when asset ID is missing', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: undefined,
      });

      const result = await deleteAssetHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Asset ID is required');
    });

    it('should return 404 when asset not found', async () => {
      mockDynamodbService.getAsset.mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'nonexistent' },
      });

      const result = await deleteAssetHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Asset not found');
    });

    it('should return 404 when asset belongs to different user', async () => {
      const otherUserAsset = {
        ...mockAsset,
        userId: 'other-user-456',
      };

      mockDynamodbService.getAsset.mockResolvedValue(otherUserAsset);

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'asset-123' },
      });

      const result = await deleteAssetHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('Asset not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'asset-123' },
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await deleteAssetHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockDynamodbService.getAsset).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockDynamodbService.getAsset.mockRejectedValue(new Error('Database error'));

      const event = createMockEvent({
        httpMethod: 'DELETE',
        pathParameters: { id: 'asset-123' },
      });

      const result = await deleteAssetHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });
});
