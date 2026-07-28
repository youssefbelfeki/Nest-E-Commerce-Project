import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createContext = (user?: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const ctx = createContext({ role: 'USER' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when roles array is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = createContext({ role: 'USER' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = createContext({ role: 'ADMIN' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = createContext({ role: 'USER' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException with role info in message', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = createContext({ role: 'USER' });

    try {
      guard.canActivate(ctx);
    } catch (e) {
      expect((e as ForbiddenException).message).toBe(
        'User with role "USER" is not authorized to perform this action',
      );
    }
  });

  it('should throw when no user on request', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = createContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow when user has one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['USER', 'ADMIN']);
    const ctx = createContext({ role: 'USER' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny when user has none of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const ctx = createContext({ role: 'SUPERVISOR' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
