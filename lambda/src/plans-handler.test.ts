import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './plans-handler';

vi.mock('./handlers/plans', () => ({
  getPlansHandler: vi.fn(),
  getPlanHandler: vi.fn(),
  createPlanHandler: vi.fn(),
  updatePlanHandler: vi.fn(),
  deletePlanHandler: vi.fn(),
}));

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

describe('Plans Handler Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Method Routing', () => {
    it('should route GET request to getPlansHandler when no ID is provided', async () => {
      const { getPlansHandler } = await import('./handlers/plans');
      vi.mocked(getPlansHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify([]),
      });

      const response = await handler(createEvent({ httpMethod: 'GET' }));

      expect(vi.mocked(getPlansHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should route GET request with ID to getPlanHandler', async () => {
      const { getPlanHandler } = await import('./handlers/plans');
      vi.mocked(getPlanHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ id: 'plan-1', name: 'Plan' }),
      });

      const response = await handler(createEvent({
        httpMethod: 'GET',
        pathParameters: { id: 'plan-1' },
      }));

      expect(vi.mocked(getPlanHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should route POST request to createPlanHandler', async () => {
      const { createPlanHandler } = await import('./handlers/plans');
      vi.mocked(createPlanHandler).mockResolvedValue({
        statusCode: 201,
        body: JSON.stringify({ id: 'plan-1', name: 'New Plan' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'POST',
          body: JSON.stringify({ name: 'New Plan' }),
        })
      );

      expect(vi.mocked(createPlanHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(201);
    });

    it('should route PUT request to updatePlanHandler', async () => {
      const { updatePlanHandler } = await import('./handlers/plans');
      vi.mocked(updatePlanHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ id: 'plan-1', name: 'Updated Plan' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'PUT',
          pathParameters: { id: 'plan-1' },
          body: JSON.stringify({ name: 'Updated Plan' }),
        })
      );

      expect(vi.mocked(updatePlanHandler)).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should route DELETE request to deletePlanHandler', async () => {
      const { deletePlanHandler } = await import('./handlers/plans');
      vi.mocked(deletePlanHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ message: 'Plan deleted successfully' }),
      });

      const response = await handler(
        createEvent({
          httpMethod: 'DELETE',
          pathParameters: { id: 'plan-1' },
        })
      );

      expect(vi.mocked(deletePlanHandler)).toHaveBeenCalled();
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
      const { getPlansHandler } = await import('./handlers/plans');
      vi.mocked(getPlansHandler).mockResolvedValue({
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
      const { getPlansHandler } = await import('./handlers/plans');
      vi.mocked(getPlansHandler).mockRejectedValue(new Error('Handler error'));

      const response = await handler(createEvent({ httpMethod: 'GET' }));

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Internal server error');
    });

    it('should handle invalid JSON body gracefully', async () => {
      const { createPlanHandler } = await import('./handlers/plans');
      vi.mocked(createPlanHandler).mockResolvedValue({
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
      const { getPlansHandler } = await import('./handlers/plans');
      vi.mocked(getPlansHandler).mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify([]),
      });

      const event = createEvent({
        httpMethod: 'GET',
        headers: { 'x-custom-header': 'value' },
      });

      await handler(event);

      expect(vi.mocked(getPlansHandler)).toHaveBeenCalledWith(event);
    });
  });
});
