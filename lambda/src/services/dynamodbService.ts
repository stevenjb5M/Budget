import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { TABLES, DEFAULTS } from '../constants';
import { User, Plan, Budget, Asset, Debt } from '../types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDBService {
  // Users operations
  async getUser(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
    });
    const result = await docClient.send(command);
    return (result.Item as User) || null;
  }

  async createUser(user: Omit<User, 'id' | 'version' | 'createdAt' | 'updatedAt'>, userId?: string): Promise<User> {
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

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const now = new Date().toISOString();
    const keys = Object.keys(updates).filter((key) => !['id', 'updatedAt', 'createdAt'].includes(key));
    
    const updateExpression = keys
      .map((key) => `#${key} = :${key}`)
      .join(', ');

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

  async deleteUser(userId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.USERS,
      Key: { id: userId },
    });
    await docClient.send(command);
  }

  // Plans operations
  async getUserPlans(userId: string): Promise<Plan[]> {
    // Query GSI to get IDs (KEYS_ONLY projection)
    const queryCommand = new QueryCommand({
      TableName: TABLES.PLANS,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
    const queryResult = await docClient.send(queryCommand);
    const planIds = (queryResult.Items as Array<{ id: string }>) || [];
    
    if (planIds.length === 0) return [];

    // Batch fetch full objects
    const plans = await Promise.all(
      planIds.map(item => this.getPlan(item.id))
    );
    return plans.filter((plan): plan is Plan => plan !== null);
  }

  async getPlan(planId: string): Promise<Plan | null> {
    const command = new GetCommand({
      TableName: TABLES.PLANS,
      Key: { id: planId },
    });
    const result = await docClient.send(command);
    return (result.Item as Plan) || null;
  }

  async createPlan(plan: Omit<Plan, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Plan> {
    const now = new Date().toISOString();
    const newPlan: Plan = {
      id: uuidv4(),
      ...plan,
      version: DEFAULTS.INITIAL_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLES.PLANS,
      Item: newPlan,
    });
    await docClient.send(command);
    return newPlan;
  }

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan> {
    const now = new Date().toISOString();
    const keys = Object.keys(updates).filter((key) => !['id', 'updatedAt', 'createdAt'].includes(key));
    
    const updateExpression = keys
      .map((key) => `#${key} = :${key}`)
      .join(', ');

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
      TableName: TABLES.PLANS,
      Key: { id: planId },
      UpdateExpression: `SET ${updateExpression}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes as Plan;
  }

  async deletePlan(planId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.PLANS,
      Key: { id: planId },
    });
    await docClient.send(command);
  }

  // Budgets operations
  async getPlanBudgets(planId: string): Promise<Budget[]> {
    const command = new QueryCommand({
      TableName: TABLES.BUDGETS,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': planId,
      },
    });
    const result = await docClient.send(command);
    return (result.Items as Budget[]) || [];
  }

  async getUserBudgets(userId: string): Promise<Budget[]> {
    // Query GSI to get IDs (KEYS_ONLY projection)
    const queryCommand = new QueryCommand({
      TableName: TABLES.BUDGETS,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
    const queryResult = await docClient.send(queryCommand);
    const budgetIds = (queryResult.Items as Array<{ id: string }>) || [];
    
    if (budgetIds.length === 0) return [];

    // Batch fetch full objects
    const budgets = await Promise.all(
      budgetIds.map(item => this.getBudget(item.id))
    );
    return budgets.filter((budget): budget is Budget => budget !== null);
  }

  async getBudget(budgetId: string): Promise<Budget | null> {
    const command = new GetCommand({
      TableName: TABLES.BUDGETS,
      Key: { id: budgetId },
    });
    const result = await docClient.send(command);
    return (result.Item as Budget) || null;
  }

  async createBudget(
    budget: Omit<Budget, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): Promise<Budget> {
    const now = new Date().toISOString();
    const newBudget: Budget = {
      id: uuidv4(),
      ...budget,
      version: DEFAULTS.INITIAL_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLES.BUDGETS,
      Item: newBudget,
    });
    await docClient.send(command);
    return newBudget;
  }

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget> {
    const now = new Date().toISOString();
    const keys = Object.keys(updates).filter((key) => !['id', 'updatedAt', 'createdAt'].includes(key));
    
    const updateExpression = keys
      .map((key) => `#${key} = :${key}`)
      .join(', ');

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
      TableName: TABLES.BUDGETS,
      Key: { id: budgetId },
      UpdateExpression: `SET ${updateExpression}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes as Budget;
  }

  async deleteBudget(budgetId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.BUDGETS,
      Key: { id: budgetId },
    });
    await docClient.send(command);
  }

  // Assets operations
  async getUserAssets(userId: string): Promise<Asset[]> {
    // Query GSI to get IDs (KEYS_ONLY projection)
    const queryCommand = new QueryCommand({
      TableName: TABLES.ASSETS,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
    const queryResult = await docClient.send(queryCommand);
    const assetIds = (queryResult.Items as Array<{ id: string }>) || [];
    
    if (assetIds.length === 0) return [];

    // Batch fetch full objects
    const assets = await Promise.all(
      assetIds.map(item => this.getAsset(item.id))
    );
    return assets.filter((asset): asset is Asset => asset !== null);
  }

  async getAsset(assetId: string): Promise<Asset | null> {
    const command = new GetCommand({
      TableName: TABLES.ASSETS,
      Key: { id: assetId },
    });
    const result = await docClient.send(command);
    return (result.Item as Asset) || null;
  }

  async createAsset(asset: Omit<Asset, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    const now = new Date().toISOString();
    const newAsset: Asset = {
      id: uuidv4(),
      ...asset,
      version: DEFAULTS.INITIAL_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLES.ASSETS,
      Item: newAsset,
    });
    await docClient.send(command);
    return newAsset;
  }

  async updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset> {
    const now = new Date().toISOString();
    const keys = Object.keys(updates).filter((key) => !['id', 'updatedAt', 'createdAt'].includes(key));
    
    const updateExpression = keys
      .map((key) => `#${key} = :${key}`)
      .join(', ');

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
      TableName: TABLES.ASSETS,
      Key: { id: assetId },
      UpdateExpression: `SET ${updateExpression}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes as Asset;
  }

  async deleteAsset(assetId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.ASSETS,
      Key: { id: assetId },
    });
    await docClient.send(command);
  }

  // Debts operations
  async getUserDebts(userId: string): Promise<Debt[]> {
    // Query GSI to get IDs (KEYS_ONLY projection)
    const queryCommand = new QueryCommand({
      TableName: TABLES.DEBTS,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
    const queryResult = await docClient.send(queryCommand);
    const debtIds = (queryResult.Items as Array<{ id: string }>) || [];
    
    if (debtIds.length === 0) return [];

    // Batch fetch full objects
    const debts = await Promise.all(
      debtIds.map(item => this.getDebt(item.id))
    );
    return debts.filter((debt): debt is Debt => debt !== null);
  }

  async getDebt(debtId: string): Promise<Debt | null> {
    const command = new GetCommand({
      TableName: TABLES.DEBTS,
      Key: { id: debtId },
    });
    const result = await docClient.send(command);
    return (result.Item as Debt) || null;
  }

  async createDebt(debt: Omit<Debt, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const now = new Date().toISOString();
    const newDebt: Debt = {
      id: uuidv4(),
      ...debt,
      version: DEFAULTS.INITIAL_VERSION,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLES.DEBTS,
      Item: newDebt,
    });
    await docClient.send(command);
    return newDebt;
  }

  async updateDebt(debtId: string, updates: Partial<Debt>): Promise<Debt> {
    const now = new Date().toISOString();
    const keys = Object.keys(updates).filter((key) => !['id', 'updatedAt', 'createdAt'].includes(key));
    
    const updateExpression = keys
      .map((key) => `#${key} = :${key}`)
      .join(', ');

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
      TableName: TABLES.DEBTS,
      Key: { id: debtId },
      UpdateExpression: `SET ${updateExpression}, #updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes as Debt;
  }

  async deleteDebt(debtId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLES.DEBTS,
      Key: { id: debtId },
    });
    await docClient.send(command);
  }
}

export default new DynamoDBService();
