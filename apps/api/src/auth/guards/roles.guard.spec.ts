import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  const user: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'mentor@rootaca.com',
    displayName: 'Mentor',
    role: Role.MENTOR,
  };

  const createContext = (currentUser?: AuthenticatedUser): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: currentUser }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext(user))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });

  it('allows a matching role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.MENTOR, Role.ADMIN]);

    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('denies a mismatched role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(createContext(user))).toThrow(ForbiddenException);
  });
});
