import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';

const { mockParse, mockTryConsume } = vi.hoisted(() => ({ mockParse: vi.fn(), mockTryConsume: vi.fn() }));

vi.mock('../daos/aiUsageDAO', () => ({
  AiUsageDAO: vi.fn(() => ({ tryConsume: mockTryConsume })),
}));

vi.mock('@anthropic-ai/bedrock-sdk', () => ({
  AnthropicBedrockMantle: vi.fn(() => ({ messages: { parse: mockParse } })),
}));

import { getBudgetFeedbackHandler, generateBudgetPrompt, MODEL_ID, AI_DAILY_LIMIT } from './bedrock';

const validBody = {
  budgetName: 'Monthly Budget',
  income: [{ name: 'Salary', amount: 5000, category: 'Employment' }],
  expenses: [{ name: 'Rent', amount: 1500, category: 'Housing' }],
  totalIncome: 5000,
  totalExpenses: 1500,
};

const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => {
  return {
    httpMethod: 'POST',
    path: '/bedrock/feedback',
    headers: {},
    body: JSON.stringify(validBody),
    requestContext: {
      authorizer: {
        claims: { sub: 'test-user-123' },
      } as any,
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent;
};

const parsedResponse = (parsed_output: unknown, stop_reason = 'end_turn') => ({
  stop_reason,
  stop_details: null,
  parsed_output,
  usage: { input_tokens: 100, output_tokens: 50 },
});

describe('Bedrock Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTryConsume.mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('getBudgetFeedbackHandler', () => {
    it('should return structured feedback from Claude', async () => {
      mockParse.mockResolvedValueOnce(
        parsedResponse({
          improvements: ['Build an emergency fund', 'Automate savings', 'Track subscriptions', 'Extra'],
          strengths: ['Rent is 30% of income', 'Healthy savings rate', 'Extra'],
          summary: 'A solid budget with room to grow savings.',
        })
      );

      const result = await getBudgetFeedbackHandler(createMockEvent());

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.improvements).toHaveLength(3);
      expect(body.strengths).toHaveLength(2);
      expect(body.summary).toBe('A solid budget with room to grow savings.');

      const request = mockParse.mock.calls[0][0];
      expect(request.model).toBe(MODEL_ID);
      expect(request.output_config.format).toBeDefined();
      expect(request.messages[0].content).toContain('Savings Rate: 70.0%');
    });

    it('should accept a budget with zero expenses', async () => {
      mockParse.mockResolvedValueOnce(
        parsedResponse({ improvements: ['a'], strengths: ['b'], summary: 'c' })
      );

      const event = createMockEvent({
        body: JSON.stringify({ ...validBody, expenses: [], totalExpenses: 0 }),
      });
      const result = await getBudgetFeedbackHandler(event);

      expect(result.statusCode).toBe(200);
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({ requestContext: { authorizer: undefined } as any });
      const result = await getBudgetFeedbackHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockParse).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      const event = createMockEvent({ body: JSON.stringify({ budgetName: 'Test' }) });
      const result = await getBudgetFeedbackHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).details.missingFields).toEqual([
        'income',
        'expenses',
        'totalIncome',
        'totalExpenses',
      ]);
      expect(mockParse).not.toHaveBeenCalled();
    });

    it('should return 429 without calling the model when the daily limit is reached', async () => {
      mockTryConsume.mockResolvedValueOnce(false);

      const result = await getBudgetFeedbackHandler(createMockEvent());

      expect(result.statusCode).toBe(429);
      expect(JSON.parse(result.body).error).toContain('AI feedback for today');
      expect(mockTryConsume).toHaveBeenCalledWith('test-user-123', AI_DAILY_LIMIT);
      expect(mockParse).not.toHaveBeenCalled();
    });

    it('should not count usage for invalid requests', async () => {
      const event = createMockEvent({ body: JSON.stringify({ budgetName: 'Test' }) });
      await getBudgetFeedbackHandler(event);

      expect(mockTryConsume).not.toHaveBeenCalled();
    });

    it('should return 500 instead of canned advice when Bedrock fails', async () => {
      mockParse.mockRejectedValueOnce(new Error('AccessDeniedException'));

      const result = await getBudgetFeedbackHandler(createMockEvent());

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Could not get AI feedback right now. Please try again.');
    });

    it('should return 500 when the model refuses', async () => {
      mockParse.mockResolvedValueOnce(parsedResponse(null, 'refusal'));

      const result = await getBudgetFeedbackHandler(createMockEvent());

      expect(result.statusCode).toBe(500);
    });

    it('should return 500 when structured output is missing', async () => {
      mockParse.mockResolvedValueOnce(parsedResponse(null, 'max_tokens'));

      const result = await getBudgetFeedbackHandler(createMockEvent());

      expect(result.statusCode).toBe(500);
    });
  });

  describe('generateBudgetPrompt', () => {
    it('should handle zero income without dividing by zero', () => {
      const prompt = generateBudgetPrompt({ ...validBody, income: [], totalIncome: 0 });

      expect(prompt).toContain('Savings Rate: 0%');
      expect(prompt).toContain('Income Sources:\n  None');
    });
  });
});
