import { Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EmptyUserTableSeed } from './empty-user-table.seed';
import { PasswordService } from './crypto/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEV_SEED_USERS } from './dev-seed-users';

describe('EmptyUserTableSeed', () => {
  const prisma = {
    user: {
      count: jest.fn(),
      create: jest.fn(),
    },
  };
  const passwords = {
    hash: jest.fn(),
  };

  let seed: EmptyUserTableSeed;

  beforeEach(() => {
    jest.clearAllMocks();
    passwords.hash.mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({});
    seed = new EmptyUserTableSeed(
      prisma as unknown as PrismaService,
      passwords as unknown as PasswordService,
    );
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('skips seeding in test', async () => {
    process.env.NODE_ENV = 'test';
    await seed.onModuleInit();
    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('skips seeding when users already exist', async () => {
    process.env.NODE_ENV = 'production';
    prisma.user.count.mockResolvedValue(3);
    await seed.onModuleInit();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates staff users when the table is empty', async () => {
    process.env.NODE_ENV = 'production';
    prisma.user.count.mockResolvedValue(0);
    await seed.onModuleInit();
    expect(prisma.user.create).toHaveBeenCalledTimes(DEV_SEED_USERS.length);
    expect(passwords.hash).toHaveBeenCalledWith('DevAdmin#2026');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'admin@rootaca.com',
          role: Role.ADMIN,
          passwordHash: 'hashed-password',
        }),
      }),
    );
  });

  it('ignores unique constraint races', async () => {
    process.env.NODE_ENV = 'production';
    prisma.user.count.mockResolvedValue(0);
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await expect(seed.onModuleInit()).resolves.toBeUndefined();
  });
});
