import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PasswordService } from './crypto/password.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@rootaca.com',
    passwordHash: 'hashed',
    displayName: 'ROOTACA Admin',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };
  const passwordService = {
    verify: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_EXPIRES_IN') {
        return '15m';
      }
      if (key === 'JWT_REFRESH_EXPIRES_IN') {
        return '7d';
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('access-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: PasswordService, useValue: passwordService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('issues tokens for a valid login', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(true);
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await service.login({
      email: 'admin@rootaca.com',
      password: 'DevAdmin#2026',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.role).toBe(Role.ADMIN);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'admin@rootaca.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates a valid refresh token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id',
      tokenHash: 'hash',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      user,
    });
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await service.refresh('a-valid-refresh-token-value');

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'token-id' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result.accessToken).toBe('access-token');
  });

  it('rejects reuse of a revoked refresh token and revokes the family', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id',
      tokenHash: 'hash',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      createdAt: new Date(),
      user,
    });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.refresh('revoked-refresh-token-value')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
