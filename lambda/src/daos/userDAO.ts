import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { TABLES, DEFAULTS } from '../constants';
import { User } from '../types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export class UserDAO {
  async getById(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
    });
    const result = await docClient.send(command);
    return (result.Item as User) || null;
  }

  async create(user: Omit<User, 'id' | 'version' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<User> {
    const now = new Date().toISOString();
    const newUser: User = {
      id: userId || uuidv4(),
      ...user,
      version: DEFAULTS.INITIAL_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLES.USERS,
      Item: newUser,
    });
    await docClient.send(command);
    return newUser;
  }

  async update(userId: string, updates: Partial<User>): Promise<User> {
    const now = new Date().toISOString();
    const keys = Object.keys(updates).filter((key) => !['id', 'updatedAt', 'createdAt'].includes(key));

    const updateExpression = keys.map((key) => `#${key} = :${key}`).join(', ');

    const expressionAttributeNames = keys.reduce(
      (acc, key) => ({
        ...acc,
        [`#${key}`]: key,
      }),
      { '#updatedAt': 'updatedAt' }
    );

    const expressionAttributeValues = Object.entries(updates)
      .filter(([key]) => !['id', 'updatedAt', 'createdAt'].includes(key))
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`:${key}`]: value,
        }),
        { ':updatedAt': now }
      );

    const command = new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes as User;
  }

  async delete(userId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
    });
    await docClient.send(command);
  }
}
