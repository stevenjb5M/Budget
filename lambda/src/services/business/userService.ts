import { UserDAO } from '../../daos/userDAO';
import { User } from '../../types';

export class UserService {
  private userDAO: UserDAO;

  constructor() {
    this.userDAO = new UserDAO();
  }

  async getUser(userId: string): Promise<User | null> {
    return this.userDAO.getById(userId);
  }

  async createUser(
    userData: Omit<User, 'id' | 'version' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<User> {
    // Business logic: set defaults, validate data, etc.
    const validatedData = {
      ...userData,
      retirementAge: userData.retirementAge || 65,
    };

    return this.userDAO.create(validatedData, userId);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    // Business logic: validate updates, prevent sensitive field changes, etc.
    // Remove fields that shouldn't be updated directly
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).id;
    delete (safeUpdates as any).version;
    delete (safeUpdates as any).createdAt;

    return this.userDAO.update(userId, safeUpdates);
  }

  async deleteUser(userId: string): Promise<void> {
    // Business logic: check if user can be deleted, cascade deletes, etc.
    return this.userDAO.delete(userId);
  }
}
