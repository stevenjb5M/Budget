import { describe, it, expect, beforeEach, vi } from 'vitest';
import dynamodbService from '../dynamodbService';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

vi.mock('@aws-sdk/lib-dynamodb');

describe('DynamoDB Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('should retrieve user from DynamoDB', async () => {
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

      const mockSend = vi.fn().mockResolvedValue({ Item: mockUser });
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.getUser(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 'missing-user';
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.getUser(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      // Arrange
      const userId = 'user-123';
      const mockSend = vi.fn().mockRejectedValue(new Error('DynamoDB Error'));
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act & Assert
      await expect(dynamodbService.getUser(userId)).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('getPlansByUser', () => {
    it('should retrieve all plans for a user', async () => {
      // Arrange
      const userId = 'user-1';
      const mockPlans = [
        {
          Id: 'plan-1',
          UserId: userId,
          Name: 'Plan 1',
          Version: 1,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        },
        {
          Id: 'plan-2',
          UserId: userId,
          Name: 'Plan 2',
          Version: 1,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        },
      ];

      const mockSend = vi.fn().mockResolvedValue({ Items: mockPlans });
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.getPlansByUser(userId);

      // Assert
      expect(result).toEqual(mockPlans);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no plans', async () => {
      // Arrange
      const userId = 'user-no-plans';
      const mockSend = vi.fn().mockResolvedValue({ Items: [] });
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.getPlansByUser(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should create a new user with correct timestamps', async () => {
      // Arrange
      const newUser = {
        Id: 'new-user',
        Email: 'newuser@example.com',
        DisplayName: 'New User',
        BirthdayString: '1995-06-20',
        RetirementAge: 67,
      };

      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.createUser(newUser);

      // Assert
      expect(result.Id).toBe(newUser.Id);
      expect(result.Email).toBe(newUser.Email);
      expect(result.Version).toBe(1);
      expect(result.CreatedAt).toBeDefined();
      expect(result.UpdatedAt).toBeDefined();
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user and increment version', async () => {
      // Arrange
      const userId = 'user-123';
      const updates = {
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

      const mockSend = vi.fn().mockResolvedValue({ Attributes: updatedUser });
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.updateUser(userId, updates);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(result.Version).toBe(2);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 'missing-user';
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.updateUser(userId, { DisplayName: 'Name' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deletePlan', () => {
    it('should delete plan successfully', async () => {
      // Arrange
      const planId = 'plan-123';
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.deletePlan(planId);

      // Assert
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      // Arrange
      const planId = 'plan-123';
      const mockSend = vi.fn().mockRejectedValue(new Error('Delete failed'));
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act & Assert
      await expect(dynamodbService.deletePlan(planId)).rejects.toThrow();
    });
  });

  describe('versionControl', () => {
    it('should maintain version history on updates', async () => {
      // Arrange
      const userId = 'user-123';
      const mockSend = vi.fn().mockResolvedValue({
        Attributes: {
          Id: userId,
          Version: 3,
          UpdatedAt: new Date().toISOString(),
        },
      });
      vi.mocked(DynamoDBDocumentClient.prototype.send as any).mockImplementation(mockSend);

      // Act
      const result = await dynamodbService.updateUser(userId, { DisplayName: 'Name' });

      // Assert
      expect(result.Version).toBe(3);
    });
  });
});
