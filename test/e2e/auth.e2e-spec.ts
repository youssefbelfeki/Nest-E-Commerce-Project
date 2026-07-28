import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../../src/auth/auth.module';
import { ProductsModule } from '../../src/products/products.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaModule } from '../../src/prisma/prisma.module';

describe('Auth E2E (mocked)', () => {
  let app: INestApplication<App>;
  let prisma: any;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, ProductsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'John', email: 'john@example.com', password: 'pass123' })
        .expect(201);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body.email).toBe('john@example.com');
    });

    it('should return 409 for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'john@example.com' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'John', email: 'john@example.com', password: 'pass123' })
        .expect(409);
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'John', email: 'bad', password: 'pass123' })
        .expect(400);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'John', email: 'john@example.com', password: '12345' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should return accessToken on valid credentials', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        password: 'hashed',
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'john@example.com', password: 'pass123' })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(typeof response.body.accessToken).toBe('string');

      jest.restoreAllMocks();
    });

    it('should return 401 for wrong password', async () => {
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        password: 'hashed',
        role: 'USER',
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'john@example.com', password: 'wrong' })
        .expect(401);

      jest.restoreAllMocks();
    });

    it('should return 401 for non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'none@example.com', password: 'pass' })
        .expect(401);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });
});
