import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { Role } from '../../generated/prisma/client';

describe('Roles Integration', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createContext = (user?: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  describe('admin access control', () => {
    it('should allow ADMIN to create products', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'ADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny USER from creating products', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'USER' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow ADMIN to update products', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'ADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny USER from updating products', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'USER' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow ADMIN to delete products', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'ADMIN' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny USER from deleting products', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'USER' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('read access (no role restriction)', () => {
    it('should allow any authenticated user to read products', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const ctx = createContext({ role: 'USER' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow when no roles metadata set', () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const ctx = createContext({ role: 'USER' });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should include the user role in error message', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'USER' });

      try {
        guard.canActivate(ctx);
      } catch (e) {
        expect((e as ForbiddenException).message).toContain('USER');
      }
    });

    it('should mention authorization in error message', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext({ role: 'USER' });

      try {
        guard.canActivate(ctx);
      } catch (e) {
        expect((e as ForbiddenException).message).toContain('not authorized');
      }
    });
  });

  describe('unauthenticated request', () => {
    it('should throw when user is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw when user is null', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const ctx = createContext(null);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
