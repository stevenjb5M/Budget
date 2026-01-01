import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserHandler, updateUserHandler, createUserHandler, getUserVersionsHandler } from './users';
import { User, UserVersion } from '../types';

// Mock the UserService class
vi.mock('../services/business/userService', () => {
  const mockGetUser = vi.fn();
  const mockCreateUser = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockGetUserVersions = vi.fn();

  return {
    UserService: vi.fn(() => ({
      getUser: mockGetUser,
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      getUserVersions: mockGetUserVersions,
    })),
    mockGetUser,
    mockCreateUser,
    mockUpdateUser,
    mockGetUserVersions,
  };
});

const createMockEvent = (overrides?: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => {
  return {
    httpMethod: 'GET',
    path: '/users/me',
    headers: {},
    body: null,
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          birthdate: '1990-01-01',
        },
      } as any,
    } as any,
    ...overrides,
  } as APIGatewayProxyEvent;
};

const mockUser: User = {
  id: 'test-user-123',
  displayName: 'Test User',
  email: 'test@example.com',
  birthdayString: '1990-01-01',
  retirementAge: 65,
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockUserVersion: UserVersion = {
  userId: 'test-user-123',
  version: 1,
  data: {
    globalVersion: 1,
    budgetsVersion: 1,
    plansVersion: 1,
    assetsVersion: 1,
    debtsVersion: 1,
  },
  timestamp: '2024-01-01T00:00:00Z',
};

describe('Users Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserHandler', () => {
    it('should return existing user', async () => {
      const { mockGetUser } = await import('../services/business/userService');
      mockGetUser.mockResolvedValue(mockUser);

      const event = createMockEvent();
      const result = await getUserHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockUser);
      expect(mockGetUser).toHaveBeenCalledWith('test-user-123');
    });

    it('should auto-create user if not found', async () => {
      const { mockGetUser, mockCreateUser } = await import('../services/business/userService');
      mockGetUser.mockResolvedValueOnce(null);
      mockCreateUser.mockResolvedValueOnce(mockUser);

      const event = createMockEvent();
      const result = await getUserHandler(event);

      expect(result.statusCode).toBe(200);
      expect(mockGetUser).toHaveBeenCalledWith('test-user-123');
      expect(mockCreateUser).toHaveBeenCalledWith({
        displayName: 'Test User',
        email: 'test@example.com',
        birthdayString: '1990-01-01',
        retirementAge: 65,
      }, 'test-user-123');
    });

    it('should use default email and name when not in token', async () => {
      const { mockGetUser, mockCreateUser } = await import('../services/business/userService');
      mockGetUser.mockResolvedValueOnce(null);
      mockCreateUser.mockResolvedValueOnce(mockUser);

      const event = createMockEvent({
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-123',
            },
          } as any,
        } as any,
      });

      const result = await getUserHandler(event);

      expect(result.statusCode).toBe(200);
      expect(mockCreateUser).toHaveBeenCalledWith({
        displayName: 'User',
        email: 'unknown@example.com',
        birthdayString: '1990-01-01',
        retirementAge: 65,
      }, 'test-user-123');
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await getUserHandler(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on service error', async () => {
      const { mockGetUser } = await import('../services/business/userService');
      mockGetUser.mockRejectedValueOnce(new Error('Service error'));

      const event = createMockEvent();
      const result = await getUserHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('updateUserHandler', () => {
    it('should update user successfully', async () => {
      const { mockUpdateUser } = await import('../services/business/userService');
      const updatePayload = {
        displayName: 'Updated Name',
        retirementAge: 67,
      };

      const updatedUser = {
        ...mockUser,
        ...updatePayload,
      };

      mockUpdateUser.mockResolvedValueOnce(updatedUser);

      const event = createMockEvent({
        httpMethod: 'PUT',
        body: JSON.stringify(updatePayload),
      });

      const result = await updateUserHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updatedUser);
      expect(mockUpdateUser).toHaveBeenCalledWith('test-user-123', updatePayload);
    });

    it('should update single field', async () => {
      const { mockUpdateUser } = await import('../services/business/userService');
      mockUpdateUser.mockResolvedValueOnce(mockUser);

      const event = createMockEvent({
        httpMethod: 'PUT',
        body: JSON.stringify({ displayName: 'New Name' }),
      });

      const result = await updateUserHandler(event);

      expect(result.statusCode).toBe(200);
      expect(mockUpdateUser).toHaveBeenCalledWith('test-user-123', { displayName: 'New Name' });
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        httpMethod: 'PUT',
        body: JSON.stringify({ displayName: 'New Name' }),
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await updateUserHandler(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on service error', async () => {
      const { mockUpdateUser } = await import('../services/business/userService');
      mockUpdateUser.mockRejectedValueOnce(new Error('Service error'));

      const event = createMockEvent({
        httpMethod: 'PUT',
        body: JSON.stringify({ displayName: 'New Name' }),
      });

      const result = await updateUserHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('createUserHandler', () => {
    it('should create user with required fields', async () => {
      const { mockCreateUser } = await import('../services/business/userService');
      const createPayload = {
        displayName: 'New User',
        email: 'newuser@example.com',
      };

      mockCreateUser.mockResolvedValueOnce(mockUser);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(mockUser);
      expect(mockCreateUser).toHaveBeenCalledWith({
        displayName: 'New User',
        email: 'newuser@example.com',
        birthdayString: '1990-01-01',
        retirementAge: 65,
      });
    });

    it('should create user with optional fields', async () => {
      const { mockCreateUser } = await import('../services/business/userService');
      const createPayload = {
        displayName: 'New User',
        email: 'newuser@example.com',
        birthdayString: '1985-05-15',
        retirementAge: 70,
      };

      mockCreateUser.mockResolvedValueOnce(mockUser);

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(201);
      expect(mockCreateUser).toHaveBeenCalledWith({
        displayName: 'New User',
        email: 'newuser@example.com',
        birthdayString: '1985-05-15',
        retirementAge: 70,
      });
    });

    it('should return 400 when displayName is missing', async () => {
      const createPayload = {
        email: 'newuser@example.com',
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.error).toBe('Missing required fields');
      expect(parsedBody.details.missingFields).toContain('displayName');
    });

    it('should return 400 when email is missing', async () => {
      const createPayload = {
        displayName: 'New User',
      };

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(400);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.details.missingFields).toContain('email');
    });

    it('should return 500 on service error', async () => {
      const { mockCreateUser } = await import('../services/business/userService');
      const createPayload = {
        displayName: 'New User',
        email: 'newuser@example.com',
      };

      mockCreateUser.mockRejectedValueOnce(new Error('Service error'));

      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(createPayload),
      });

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });

  describe('getUserVersionsHandler', () => {
    it('should return user versions', async () => {
      const { mockGetUserVersions } = await import('../services/business/userService');
      mockGetUserVersions.mockResolvedValueOnce(mockUserVersion);

      const event = createMockEvent({ path: '/users/versions' });
      const result = await getUserVersionsHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockUserVersion.data);
      expect(mockGetUserVersions).toHaveBeenCalledWith('test-user-123');
    });

    it('should return 404 when user versions not found', async () => {
      const { mockGetUserVersions } = await import('../services/business/userService');
      mockGetUserVersions.mockResolvedValueOnce(null);

      const event = createMockEvent({ path: '/users/versions' });
      const result = await getUserVersionsHandler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('User versions not found');
    });

    it('should return 401 when not authorized', async () => {
      const event = createMockEvent({
        path: '/users/versions',
        requestContext: {
          authorizer: undefined,
        } as any,
      });

      const result = await getUserVersionsHandler(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toBe('Unauthorized access');
    });

    it('should return 500 on service error', async () => {
      const { mockGetUserVersions } = await import('../services/business/userService');
      mockGetUserVersions.mockRejectedValueOnce(new Error('Service error'));

      const event = createMockEvent({ path: '/users/versions' });
      const result = await getUserVersionsHandler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Internal server error');
    });
  });
});

