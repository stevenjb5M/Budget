import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserHandler, createUserHandler, updateUserHandler } from '../users';
import dynamodbService from '../../services/dynamodbService';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as auth from '../../middleware/auth';

vi.mock('../../services/dynamodbService');
vi.mock('../../middleware/auth');

describe('Users Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => ({
    httpMethod: 'GET',
    path: '/users',
    headers: {
      Authorization: 'Bearer token',
    },
    body: null,
    isBase64Encoded: false,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    multiValueHeaders: {},
    requestContext: {
      httpMethod: 'GET',
      path: '/users',
      requestId: 'test-request-id',
      stage: 'test',
      accountId: '123456789',
      apiId: 'api-id',
      identity: {
        sourceIp: '127.0.0.1',
      },
    },
    resource: '',
    stageVariables: null,
    ...overrides,
  });

  describe('getUserHandler', () => {
    it('should return user when authorized and user exists', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = {
        Id: userId,
        Email: 'test@example.com',
        DisplayName: 'Test User',
        BirthdayString: '1990-05-15',
        RetirementAge: 65,
        Version: 1,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getUser).mockResolvedValue(mockUser);

      const event = createMockEvent();

      // Act
      const result = await getUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockUser);
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent();

      // Act
      const result = await getUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const userId = 'user-123';
      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getUser).mockResolvedValue(null);

      const event = createMockEvent();

      // Act
      const result = await getUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toBe('User not found');
    });

    it('should return 500 on service error', async () => {
      // Arrange
      const userId = 'user-123';
      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.getUser).mockRejectedValue(new Error('DB error'));

      const event = createMockEvent();

      // Act
      const result = await getUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toBe('Internal server error');
    });
  });

  describe('createUserHandler', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userId = 'user-123';
      const userData = {
        Email: 'newuser@example.com',
        DisplayName: 'New User',
        BirthdayString: '1995-06-20',
        RetirementAge: 67,
      };

      const createdUser = {
        Id: userId,
        ...userData,
        Version: 1,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.createUser).mockResolvedValue(createdUser);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });

      // Act
      const result = await createUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(createdUser);
    });

    it('should return 400 with missing required fields', async () => {
      // Arrange
      const userId = 'user-123';
      const incompleteData = {
        Email: 'newuser@example.com',
        // Missing DisplayName
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(incompleteData),
      });

      // Act
      const result = await createUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('required');
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ Email: 'test@example.com' }),
      });

      // Act
      const result = await createUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
    });
  });

  describe('updateUserHandler', () => {
    it('should update user with valid data', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        DisplayName: 'Updated Name',
        RetirementAge: 70,
      };

      const updatedUser = {
        Id: userId,
        Email: 'test@example.com',
        DisplayName: 'Updated Name',
        BirthdayString: '1990-05-15',
        RetirementAge: 70,
        Version: 2,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };

      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.updateUser).mockResolvedValue(updatedUser);

      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/users/${userId}`,
        pathParameters: { id: userId },
        body: JSON.stringify(updateData),
      });

      // Act
      const result = await updateUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updatedUser);
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const userId = 'user-123';
      vi.mocked(auth.validateAuthorization).mockReturnValue(userId);
      vi.mocked(dynamodbService.updateUser).mockResolvedValue(null);

      const event = createMockEvent({
        httpMethod: 'PUT',
        path: `/users/${userId}`,
        pathParameters: { id: userId },
        body: JSON.stringify({ DisplayName: 'Updated' }),
      });

      // Act
      const result = await updateUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(404);
    });

    it('should return 401 when not authorized', async () => {
      // Arrange
      vi.mocked(auth.validateAuthorization).mockReturnValue(null);
      const event = createMockEvent({
        httpMethod: 'PUT',
        path: '/users/user-123',
        pathParameters: { id: 'user-123' },
        body: JSON.stringify({ DisplayName: 'Updated' }),
      });

      // Act
      const result = await updateUserHandler(event);

      // Assert
      expect(result.statusCode).toBe(401);
    });
  });
});
