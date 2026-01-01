import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './users-handler';

// Mock the handlers module
vi.mock('./handlers/users', () => ({
  getUserHandler: vi.fn(),
  updateUserHandler: vi.fn(),
  createUserHandler: vi.fn(),
  getUserVersionsHandler: vi.fn(),
}));

const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => {
  return {
    httpMethod: 'GET',
    path: '/users/me',
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

describe('Users Handler Router', () => {
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

    it('should route GET /users/me to getUserHandler', async () => {
      const { getUserHandler } = await import('./handlers/users');
      const mockGetUser = getUserHandler as any;
      mockGetUser.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'GET', path: '/users/me' });
      const result = await handler(event);

      expect(mockGetUser).toHaveBeenCalledWith(event);
      expect(result.statusCode).toBe(200);
    });

    it('should route PUT /users/me to updateUserHandler', async () => {
      const { updateUserHandler } = await import('./handlers/users');
      const mockUpdateUser = updateUserHandler as any;
      mockUpdateUser.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'PUT', path: '/users/me', body: '{}' });
      const result = await handler(event);

      expect(mockUpdateUser).toHaveBeenCalledWith(event);
    });

    it('should route POST /users to createUserHandler', async () => {
      const { createUserHandler } = await import('./handlers/users');
      const mockCreateUser = createUserHandler as any;
      mockCreateUser.mockResolvedValue({
        statusCode: 201,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'POST', path: '/users', body: '{}' });
      const result = await handler(event);

      expect(mockCreateUser).toHaveBeenCalledWith(event);
      expect(result.statusCode).toBe(201);
    });

    it('should route GET /users/versions to getUserVersionsHandler', async () => {
      const { getUserVersionsHandler } = await import('./handlers/users');
      const mockGetVersions = getUserVersionsHandler as any;
      mockGetVersions.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'GET', path: '/users/versions' });
      const result = await handler(event);

      expect(mockGetVersions).toHaveBeenCalledWith(event);
    });

    it('should route GET /api/users/versions to getUserVersionsHandler', async () => {
      const { getUserVersionsHandler } = await import('./handlers/users');
      const mockGetVersions = getUserVersionsHandler as any;
      mockGetVersions.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'GET', path: '/api/users/versions' });
      const result = await handler(event);

      expect(mockGetVersions).toHaveBeenCalledWith(event);
    });

    it('should return 405 for unsupported method on /users/me', async () => {
      const event = createMockEvent({ httpMethod: 'DELETE', path: '/users/me' });
      const result = await handler(event);

      expect(result.statusCode).toBe(405);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Method not allowed');
    });

    it('should route POST /users/versions to default routes (not versions handler)', async () => {
      const { createUserHandler } = await import('./handlers/users');
      const mockCreateUser = createUserHandler as any;
      mockCreateUser.mockResolvedValue({
        statusCode: 201,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'POST', path: '/users/versions', body: '{}' });
      const result = await handler(event);

      expect(mockCreateUser).toHaveBeenCalled();
      expect(result.statusCode).toBe(201);
    });

    it('should return 405 for unsupported method on /users', async () => {
      const event = createMockEvent({ httpMethod: 'DELETE', path: '/users' });
      const result = await handler(event);

      expect(result.statusCode).toBe(405);
    });
  });

  describe('Path-based routing', () => {
    it('should prioritize /versions path over default routes', async () => {
      const { getUserVersionsHandler } = await import('./handlers/users');
      const mockGetVersions = getUserVersionsHandler as any;
      mockGetVersions.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'GET', path: '/api/users/123/versions' });
      const result = await handler(event);

      expect(mockGetVersions).toHaveBeenCalled();
    });

    it('should prioritize /me path over default routes', async () => {
      const { getUserHandler } = await import('./handlers/users');
      const mockGetUser = getUserHandler as any;
      mockGetUser.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'GET', path: '/api/users/me' });
      const result = await handler(event);

      expect(mockGetUser).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should catch handler errors and return 500', async () => {
      const { getUserHandler } = await import('./handlers/users');
      const mockGetUser = getUserHandler as any;
      mockGetUser.mockRejectedValue(new Error('Unexpected error'));

      const event = createMockEvent({ httpMethod: 'GET' });
      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Internal server error');
    });

    it('should include CORS headers in error responses', async () => {
      const event = createMockEvent({ httpMethod: 'PATCH', path: '/users/me' });
      const result = await handler(event);

      expect(result.headers['Access-Control-Allow-Origin']).toBeDefined();
      expect(result.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request validation', () => {
    it('should pass full event to handlers', async () => {
      const { getUserHandler } = await import('./handlers/users');
      const mockGetUser = getUserHandler as any;
      mockGetUser.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: '{}',
      });

      const customEvent = createMockEvent({
        httpMethod: 'GET',
        path: '/api/users/me',
        queryStringParameters: { includeVersions: 'true' },
      });

      await handler(customEvent);

      const callArgs = mockGetUser.mock.calls[0][0];
      expect(callArgs.path).toBe('/api/users/me');
      expect(callArgs.queryStringParameters).toEqual({ includeVersions: 'true' });
    });
  });
});
