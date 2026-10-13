import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth Integration', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'USER',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register + login flow', () => {
    it('should register user then login successfully', async () => {
      // Register
      prisma.user.findUnique.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      prisma.user.create.mockResolvedValueOnce(mockUser);

      const registered = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(registered).not.toHaveProperty('password');

      // Login
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginResult = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loginResult.accessToken).toBeDefined();
      expect(typeof loginResult.accessToken).toBe('string');
    });

    it('should generate a valid JWT that can be verified', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValueOnce(mockUser);

      await service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'pass123',
      });

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { accessToken } = await service.login({
        email: 'test@example.com',
        password: 'pass123',
      });

      const decoded = jwtService.verify(accessToken, {
        secret: process.env.JWT_SECRET || 'test-secret',
      });

      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });
  });

  describe('duplicate email prevention', () => {
    it('should prevent registering with existing email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Another',
          email: 'test@example.com',
          password: 'pass123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('credential validation', () => {
    it('should reject login with wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'none@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
