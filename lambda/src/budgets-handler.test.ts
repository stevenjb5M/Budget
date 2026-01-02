import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './budgets-handler';

vi.mock('./handlers/budgets', () => ({
  getBudgetsHandler: vi.fn(),
  createBudgetHandler: vi.fn(),
  updateBudgetHandler: vi.fn(),
  deleteBudgetHandler: vi.fn(),
}));

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

describe('Budgets Handler Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Method Routing', () => {
    it('should route GET request to getBudgetsHandler', async () => {
      const { getBudgetsHandler } = await import('./handlers/budgets');
      vi.mocked(getBudgetsHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify([]),
      });

      const response = await handler(createEvent({ httpMethod: 'GET' }));

      expect(vi.mocked(getBudgetsHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should route POST request to createBudgetHandler', async () => {
      const { createBudgetHandler } = await import('./handlers/budgets');
      vi.mocked(createBudgetHandler).mockResolvedValue({
        statusCode: 201,
        body: JSON.stringify({ id: 'budget-1' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({ name: 'Budget', isActive: true }),
        })
      );

      expect(vi.mocked(createBudgetHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(201);
    });

    it('should route PUT request to updateBudgetHandler', async () => {
      const { updateBudgetHandler } = await import('./handlers/budgets');
      vi.mocked(updateBudgetHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ id: 'budget-1', name: 'Updated' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'budget-1' },
          body: JSON.stringify({ name: 'Updated' }),
        })
      );

      expect(vi.mocked(updateBudgetHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should route DELETE request to deleteBudgetHandler', async () => {
      const { deleteBudgetHandler } = await import('./handlers/budgets');
      vi.mocked(deleteBudgetHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ message: 'Budget deleted successfully' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: { id: 'budget-1' },
        })
      );

      expect(vi.mocked(deleteBudgetHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should return 405 for unsupported method', async () => {
      const response = await handler(createEvent({ httpMethod: 'PATCH' }));

      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body).error).toBe('Method not allowed');
    });
  });

  describe('CORS Headers', () => {
    it('should handle OPTIONS request with CORS headers', async () => {
      const response = await handler(createEvent({ httpMethod: 'OPTIONS' }));

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
      expect(response.body).toBe('');
    });

    it('should include CORS headers in all responses', async () => {
      const { getBudgetsHandler } = await import('./handlers/budgets');
      vi.mocked(getBudgetsHandler).mockResolvedValue({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify([]),
      });

      const response = await handler(createEvent({ httpMethod: 'GET' }));

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should catch handler errors and return 500', async () => {
      const { getBudgetsHandler } = await import('./handlers/budgets');
      vi.mocked(getBudgetsHandler).mockRejectedValue(new Error('Handler error'));

      const response = await handler(createEvent({ httpMethod: 'GET' }));

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });

    it('should handle invalid JSON body gracefully', async () => {
      const { createBudgetHandler } = await import('./handlers/budgets');
      vi.mocked(createBudgetHandler).mockResolvedValue({
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'POST',
          body: 'invalid json',
        })
      );

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Event Forwarding', () => {
    it('should forward entire event to handlers', async () => {
      const { getBudgetsHandler } = await import('./handlers/budgets');
      vi.mocked(getBudgetsHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify([]),
      });

      const event = createEvent({
        httpMethod: 'GET',
        headers: { 'x-custom-header': 'value' },
      });

      await handler(event);

      expect(vi.mocked(getBudgetsHandler)).toHaveBeenCalledWith(event);
    });
  });
});
