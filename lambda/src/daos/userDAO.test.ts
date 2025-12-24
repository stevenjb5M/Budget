import { describe, it, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-dynamodb');
vi.mock('@aws-sdk/lib-dynamodb');

describe('UserDAO', () => {
  it('should export UserDAO class', async () => {
    const { UserDAO } = await import('./userDAO');
    expect(UserDAO).toBeDefined();
    expect(typeof UserDAO).toBe('function');
  });

  it('should have CRUD methods', async () => {
    const { UserDAO } = await import('./userDAO');
    const dao = new UserDAO();

    expect(dao.getById).toBeDefined();
    expect(dao.create).toBeDefined();
    expect(dao.update).toBeDefined();
    expect(dao.delete).toBeDefined();
    expect(typeof dao.getById).toBe('function');
    expect(typeof dao.create).toBe('function');
    expect(typeof dao.update).toBe('function');
    expect(typeof dao.delete).toBe('function');
  });
});

