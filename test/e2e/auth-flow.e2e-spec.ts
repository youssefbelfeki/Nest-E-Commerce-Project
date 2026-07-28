import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../../src/auth/auth.module';
import { ProductsModule } from '../../src/products/products.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

describe('Auth Flow E2E (mocked)', () => {
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

  describe('complete user journey', () => {
    it('should register, login, and use token to access products', async () => {
      // Step 1: Register
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({
        id: 1,
        name: 'Journey User',
        email: 'journey@example.com',
        role: 'USER',
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Journey User', email: 'journey@example.com', password: 'pass123' })
        .expect(201);

      // Step 2: Login
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'journey@example.com',
        password: 'hashed',
        role: 'USER',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'journey@example.com', password: 'pass123' })
        .expect(200);

      const { accessToken } = loginResponse.body;

      // Step 3: Use token to get products
      prisma.product.findMany.mockResolvedValue([]);
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      jest.restoreAllMocks();
    });

    it('should register admin, login, and create product', async () => {
      // Step 1: Register admin
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({
        id: 2,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Admin User', email: 'admin@example.com', password: 'admin123' })
        .expect(201);

      // Step 2: Login as admin
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 2,
        email: 'admin@example.com',
        password: 'hashed',
        role: 'ADMIN',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' })
        .expect(200);

      const { accessToken } = loginResponse.body;

      // Step 3: Create product as admin
      prisma.product.create.mockResolvedValueOnce({
        id: 1,
        name: 'New Product',
        price: 29.99,
        stock: 100,
      });

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'New Product', price: 29.99, stock: 100 })
        .expect(201);

      jest.restoreAllMocks();
    });

    it('should reject user attempting admin operations', async () => {
      // Login as regular user
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 3,
        email: 'user@example.com',
        password: 'hashed',
        role: 'USER',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'pass123' })
        .expect(200);

      const { accessToken } = loginResponse.body;

      // Attempt to create product
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Should Fail', price: 10, stock: 1 })
        .expect(403);

      jest.restoreAllMocks();
    });
  });
});
