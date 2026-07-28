import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: {
    verifyAsync: jest.Mock;
  };

  const mockRequest = (authorization?: string) => ({
    headers: {
      authorization,
    },
  });

  const mockContext = (authorization?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => mockRequest(authorization),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    guard = new AuthGuard(jwtService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access and attach user for valid token', async () => {
      const payload = { sub: 1, email: 'test@example.com', role: 'USER' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const request = mockRequest('Bearer valid-token');
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(request['user']).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should throw UnauthorizedException when no Authorization header', async () => {
      const ctx = mockContext(undefined);

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when header is empty string', async () => {
      const ctx = mockContext('');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when scheme is not Bearer', async () => {
      const ctx = mockContext('Basic abc123');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt invalid'));
      const ctx = mockContext('Bearer invalid-token');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const ctx = mockContext('Bearer expired-token');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw with "Invalid or expired token" message on verify failure', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad'));
      const ctx = mockContext('Bearer bad-token');

      try {
        await guard.canActivate(ctx);
      } catch (e) {
        expect((e as UnauthorizedException).message).toBe('Invalid or expired token');
      }
    });

    it('should throw with "Missing or invalid authorization header" when no header', async () => {
      const ctx = mockContext();

      try {
        await guard.canActivate(ctx);
      } catch (e) {
        expect((e as UnauthorizedException).message).toBe(
          'Missing or invalid authorization header',
        );
      }
    });
  });
});
