import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './assets-handler';

// Mock the handlers module
vi.mock('./handlers/assets', () => ({
  getAssetsHandler: vi.fn(),
  createAssetHandler: vi.fn(),
  updateAssetHandler: vi.fn(),
  deleteAssetHandler: vi.fn(),
}));

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
        },
      } as any,
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent;
};

describe('Assets Handler Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP method routing', () => {
    it('should handle OPTIONS request with CORS headers', async () => {
      const event = createMockEvent({ httpMethod: 'OPTIONS' });
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('PUT');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('DELETE');
      expect(result.headers['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(result.headers['Access-Control-Allow-Headers']).toContain('Authorization');
      expect(result.body).toBe('');
    });

    it('should route GET request to getAssetsHandler', async () => {
      const { getAssetsHandler } = await import('./handlers/assets');
      const mockGetAssets = getAssetsHandler as any;
      mockGetAssets.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify([]),
      });

      const event = createMockEvent({ httpMethod: 'GET' });
      const result = await handler(event);

      expect(mockGetAssets).toHaveBeenCalledWith(event);
      expect(result.statusCode).toBe(200);
    });

    it('should route POST request to createAssetHandler', async () => {
      const { createAssetHandler } = await import('./handlers/assets');
      const mockCreateAsset = createAssetHandler as any;
      mockCreateAsset.mockResolvedValue({
        statusCode: 201,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'POST', body: '{}' });
      const result = await handler(event);

      expect(mockCreateAsset).toHaveBeenCalledWith(event);
      expect(result.statusCode).toBe(201);
    });

    it('should route PUT request to updateAssetHandler', async () => {
      const { updateAssetHandler } = await import('./handlers/assets');
      const mockUpdateAsset = updateAssetHandler as any;
      mockUpdateAsset.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'PUT', body: '{}' });
      const result = await handler(event);

      expect(mockUpdateAsset).toHaveBeenCalledWith(event);
    });

    it('should route DELETE request to deleteAssetHandler', async () => {
      const { deleteAssetHandler } = await import('./handlers/assets');
      const mockDeleteAsset = deleteAssetHandler as any;
      mockDeleteAsset.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'DELETE' });
      const result = await handler(event);

      expect(mockDeleteAsset).toHaveBeenCalledWith(event);
    });

    it('should return 405 for unsupported method', async () => {
      const event = createMockEvent({ httpMethod: 'PATCH' });
      const result = await handler(event);

      expect(result.statusCode).toBe(405);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Method not allowed');
    });
  });

  describe('Error handling', () => {
    it('should catch handler errors and return 500', async () => {
      const { getAssetsHandler } = await import('./handlers/assets');
      const mockGetAssets = getAssetsHandler as any;
      mockGetAssets.mockRejectedValue(new Error('Unexpected error'));

      const event = createMockEvent({ httpMethod: 'GET' });
      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should include CORS headers in error responses', async () => {
      const event = createMockEvent({ httpMethod: 'PATCH' });
      const result = await handler(event);

      expect(result.headers['Access-Control-Allow-Origin']).toBeDefined();
      expect(result.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request validation', () => {
    it('should pass full event to handlers', async () => {
      const { getAssetsHandler } = await import('./handlers/assets');
      const mockGetAssets = getAssetsHandler as any;
      mockGetAssets.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: '[]',
      });

      const customEvent = createMockEvent({
        httpMethod: 'GET',
        path: '/assets/123',
        queryStringParameters: { filter: 'active' },
      });

      await handler(customEvent);

      const callArgs = mockGetAssets.mock.calls[0][0];
      expect(callArgs.path).toBe('/assets/123');
      expect(callArgs.queryStringParameters).toEqual({ filter: 'active' });
    });
  });
});
