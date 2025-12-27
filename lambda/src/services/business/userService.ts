import { UserDAO } from '../../daos/userDAO';
import { UserVersionDAO } from '../../daos/userVersionDAO';
import { User, UserVersion } from '../../types';

export class UserService {
  private userDAO: UserDAO;
  private userVersionDAO: UserVersionDAO;

  constructor() {
    this.userDAO = new UserDAO();
    this.userVersionDAO = new UserVersionDAO();
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

    const user = await this.userDAO.create(validatedData, userId);
    
    // Record version in UserVersions table
    await this.userVersionDAO.create({
      userId: user.id,
      version: user.version,
      data: {
        globalVersion: user.version,
        budgetsVersion: 1,
        plansVersion: 1,
        assetsVersion: 1,
        debtsVersion: 1,
      },
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    // Business logic: validate updates, prevent sensitive field changes, etc.
    // Remove fields that shouldn't be updated directly
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).id;
    delete (safeUpdates as any).version;
    delete (safeUpdates as any).createdAt;

    const updatedUser = await this.userDAO.update(userId, safeUpdates);
    
    // Record version in UserVersions table
    const currentVersions = await this.userVersionDAO.getByUserId(userId);
    await this.userVersionDAO.create({
      userId,
      version: updatedUser.version,
      data: {
        ...(currentVersions?.data || {}),
        globalVersion: updatedUser.version,
      },
      timestamp: new Date().toISOString(),
    });

    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    // Business logic: check if user can be deleted, cascade deletes, etc.
    return this.userDAO.delete(userId);
  }

  async getUserVersions(userId: string): Promise<UserVersion | null> {
    return this.userVersionDAO.getByUserId(userId);
  }
}
