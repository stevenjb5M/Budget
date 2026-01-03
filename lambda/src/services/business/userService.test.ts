import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserService } from '../business/userService';
import { UserDAO } from '../../daos/userDAO';
import { UserVersionDAO } from '../../daos/userVersionDAO';
import { User } from '../../types';

vi.mock('../../daos/userDAO');
vi.mock('../../daos/userVersionDAO');

describe('UserService', () => {
  let userService: UserService;
  let mockUserDAO: any;
  let mockUserVersionDAO: any;

  beforeEach(() => {
    mockUserDAO = {
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockUserVersionDAO = {
      create: vi.fn(),
      getByUserId: vi.fn(),
    };

    vi.mocked(UserDAO).mockImplementation(() => mockUserDAO);
    vi.mocked(UserVersionDAO).mockImplementation(() => mockUserVersionDAO);
    userService = new UserService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user from DAO', async () => {
      const mockUser: User = {
        id: 'user-123',
        displayName: 'John Doe',
        email: 'john@example.com',
        birthdayString: '1990-01-01',
        retirementAge: 65,
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockUserDAO.getById.mockResolvedValue(mockUser);

      const result = await userService.getUser('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserDAO.getById).toHaveBeenCalledWith('user-123');
    });

    it('should return null when user not found', async () => {
      mockUserDAO.getById.mockResolvedValue(null);

      const result = await userService.getUser('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with default retirement age', async () => {
      const userData = {
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        birthdayString: '1995-05-15',
        retirementAge: 0,
      };

      const createdUser: User = {
        id: 'user-456',
        ...userData,
        retirementAge: 65,
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockUserDAO.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData, 'user-456');

      expect(result.retirementAge).toBe(65);
      expect(mockUserDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Jane Doe',
          email: 'jane@example.com',
          retirementAge: 65,
        }),
        'user-456'
      );
    });

    it('should use provided retirement age if greater than 0', async () => {
      const userData = {
        displayName: 'Test User',
        email: 'test@example.com',
        birthdayString: '2000-01-01',
        retirementAge: 70,
      };

      const createdUser: User = {
        id: 'user-789',
        ...userData,
        version: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockUserDAO.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(result.retirementAge).toBe(70);
      expect(mockUserDAO.create).toHaveBeenCalledWith(
        expect.objectContaining({ retirementAge: 70 }),
        undefined
      );
    });
  });

  describe('updateUser', () => {
    it('should sanitize updates before calling DAO', async () => {
      const updates = {
        displayName: 'Jane Smith',
        id: 'hacker-id',
        version: 999,
        createdAt: '2020-01-01T00:00:00Z',
      } as Partial<User>;

      const updatedUser: User = {
        id: 'user-123',
        displayName: 'Jane Smith',
        email: 'jane@example.com',
        birthdayString: '1995-05-15',
        retirementAge: 67,
        version: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockUserDAO.update.mockResolvedValue(updatedUser);

      await userService.updateUser('user-123', updates);

      // Verify that id, version, and createdAt were removed
      expect(mockUserDAO.update).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          displayName: 'Jane Smith',
        })
      );

      const callArgs = mockUserDAO.update.mock.calls[0][1];
      expect(callArgs.id).toBeUndefined();
      expect(callArgs.version).toBeUndefined();
      expect(callArgs.createdAt).toBeUndefined();
    });

    it('should allow safe field updates', async () => {
      const updates = {
        displayName: 'New Name',
        retirementAge: 68,
      } as Partial<User>;

      const updatedUser: User = {
        id: 'user-123',
        displayName: 'New Name',
        email: 'jane@example.com',
        birthdayString: '1995-05-15',
        retirementAge: 68,
        version: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockUserDAO.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user-123', updates);

      expect(result.displayName).toBe('New Name');
      expect(result.retirementAge).toBe(68);
    });
  });

  describe('deleteUser', () => {
    it('should delete user via DAO', async () => {
      mockUserDAO.delete.mockResolvedValue(undefined);

      await userService.deleteUser('user-123');

      expect(mockUserDAO.delete).toHaveBeenCalledWith('user-123');
    });

    it('should propagate deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockUserDAO.delete.mockRejectedValue(error);

      await expect(userService.deleteUser('user-123')).rejects.toThrow('Deletion failed');
    });
  });
});
