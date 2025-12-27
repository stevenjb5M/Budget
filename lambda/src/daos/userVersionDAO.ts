import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { TABLES } from '../constants';
import { UserVersion } from '../types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export class UserVersionDAO {
  async getByUserId(userId: string): Promise<UserVersion | null> {
    const command = new GetCommand({
      TableName: TABLES.USER_VERSIONS,
      Key: { userId },
    });
    const result = await docClient.send(command);
    return (result.Item as UserVersion) || null;
  }

  async create(userVersion: Omit<UserVersion, 'id'>): Promise<UserVersion> {
    const newVersion: UserVersion = {
      id: `${userVersion.userId}-${Date.now()}`,
      ...userVersion,
    };

    const command = new PutCommand({
      TableName: TABLES.USER_VERSIONS,
      Item: newVersion,
    });
    await docClient.send(command);
    return newVersion;
  }
}
