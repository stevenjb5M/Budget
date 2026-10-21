import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('@aws-sdk/lib-dynamodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/lib-dynamodb')>();
  return {
    ...actual,
    DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  };
});

import { AiUsageDAO } from './aiUsageDAO';

describe('AiUsageDAO', () => {
  const dao = new AiUsageDAO();
  const now = new Date('2026-10-21T15:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should count a request under the limit', async () => {
    mockSend.mockResolvedValueOnce({});

    const allowed = await dao.tryConsume('user-1', 20, now);

    expect(allowed).toBe(true);
    const input = mockSend.mock.calls[0][0].input;
    expect(input.Key).toEqual({ userId: 'user-1', day: '2026-10-21' });
    expect(input.ExpressionAttributeValues[':limit']).toBe(20);
    expect(input.ConditionExpression).toContain('requestCount < :limit');
  });

  it('should return false when the limit is reached', async () => {
    mockSend.mockRejectedValueOnce(
      new ConditionalCheckFailedException({ message: 'The conditional request failed', $metadata: {} })
    );

    expect(await dao.tryConsume('user-1', 20, now)).toBe(false);
  });

  it('should rethrow other DynamoDB errors', async () => {
    mockSend.mockRejectedValueOnce(new Error('ProvisionedThroughputExceeded'));

    await expect(dao.tryConsume('user-1', 20, now)).rejects.toThrow('ProvisionedThroughputExceeded');
  });
});
