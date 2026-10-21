import { DynamoDBClient, ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../constants';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Keep usage rows for two days, then let DynamoDB TTL delete them
const RETENTION_SECONDS = 2 * 24 * 60 * 60;

export class AiUsageDAO {
  /**
   * Atomically counts one AI request for the user today (UTC).
   * Returns false, without counting, when the user has already reached the daily limit.
   */
  async tryConsume(userId: string, dailyLimit: number, now = new Date()): Promise<boolean> {
    const command = new UpdateCommand({
      TableName: TABLES.AI_USAGE,
      Key: { userId, day: now.toISOString().slice(0, 10) },
      UpdateExpression: 'ADD requestCount :one SET expiresAt = :expiresAt',
      ConditionExpression: 'attribute_not_exists(requestCount) OR requestCount < :limit',
      ExpressionAttributeValues: {
        ':one': 1,
        ':limit': dailyLimit,
        ':expiresAt': Math.floor(now.getTime() / 1000) + RETENTION_SECONDS,
      },
    });

    try {
      await docClient.send(command);
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      throw error;
    }
  }
}
