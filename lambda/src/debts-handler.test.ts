import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './debts-handler';

// Mock the handlers module
vi.mock('./handlers/debts', () => ({
  getDebtsHandler: vi.fn(),
  createDebtHandler: vi.fn(),
  updateDebtHandler: vi.fn(),
  deleteDebtHandler: vi.fn(),
}));

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
        },
      } as any,
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent;
};

describe('Debts Handler Router', () => {
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

    it('should route GET request to getDebtsHandler', async () => {
      const { getDebtsHandler } = await import('./handlers/debts');
      const mockGetDebts = getDebtsHandler as any;
      mockGetDebts.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify([]),
      });

      const event = createMockEvent({ httpMethod: 'GET' });
      const result = await handler(event);

      expect(mockGetDebts).toHaveBeenCalledWith(event);
      expect(result.statusCode).toBe(200);
    });

    it('should route POST request to createDebtHandler', async () => {
      const { createDebtHandler } = await import('./handlers/debts');
      const mockCreateDebt = createDebtHandler as any;
      mockCreateDebt.mockResolvedValue({
        statusCode: 201,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'POST', body: '{}' });
      const result = await handler(event);

      expect(mockCreateDebt).toHaveBeenCalledWith(event);
      expect(result.statusCode).toBe(201);
    });

    it('should route PUT request to updateDebtHandler', async () => {
      const { updateDebtHandler } = await import('./handlers/debts');
      const mockUpdateDebt = updateDebtHandler as any;
      mockUpdateDebt.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'PUT', body: '{}' });
      const result = await handler(event);

      expect(mockUpdateDebt).toHaveBeenCalledWith(event);
    });

    it('should route DELETE request to deleteDebtHandler', async () => {
      const { deleteDebtHandler } = await import('./handlers/debts');
      const mockDeleteDebt = deleteDebtHandler as any;
      mockDeleteDebt.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: JSON.stringify({}),
      });

      const event = createMockEvent({ httpMethod: 'DELETE' });
      const result = await handler(event);

      expect(mockDeleteDebt).toHaveBeenCalledWith(event);
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
      const { getDebtsHandler } = await import('./handlers/debts');
      const mockGetDebts = getDebtsHandler as any;
      mockGetDebts.mockRejectedValue(new Error('Unexpected error'));

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
      const { getDebtsHandler } = await import('./handlers/debts');
      const mockGetDebts = getDebtsHandler as any;
      mockGetDebts.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: '[]',
      });

      const customEvent = createMockEvent({
        httpMethod: 'GET',
        path: '/debts/123',
        queryStringParameters: { filter: 'active' },
      });

      await handler(customEvent);

      const callArgs = mockGetDebts.mock.calls[0][0];
      expect(callArgs.path).toBe('/debts/123');
      expect(callArgs.queryStringParameters).toEqual({ filter: 'active' });
    });
  });
});
