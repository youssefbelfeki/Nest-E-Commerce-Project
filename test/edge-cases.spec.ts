import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { ProductsModule } from '../src/products/products.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

describe('Edge Cases & Error Handling', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
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

    moduleFixture = await Test.createTestingModule({
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

  describe('validation edge cases', () => {
    it('should handle empty string fields on register', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: '', email: '', password: '' })
        .expect(400);
    });

    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(10000);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: longString,
        email: 'test@test.com',
        role: 'USER',
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: longString, email: 'test@test.com', password: 'pass123' })
        .expect(201);
    });

    it('should handle unicode in name field', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: 'Ünïcödé Usér',
        email: 'unicode@test.com',
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Ünïcödé Usér', email: 'unicode@test.com', password: 'pass123' })
        .expect(201);

      expect(response.body.name).toBe('Ünïcödé Usér');
    });

    it('should handle emoji in name field', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: '😀 Test User',
        email: 'emoji@test.com',
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: '😀 Test User', email: 'emoji@test.com', password: 'pass123' })
        .expect(201);

      expect(response.body.name).toBe('😀 Test User');
    });

    it('should handle null fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: null, email: null, password: null })
        .expect(400);
    });

    it('should handle extra whitespace in email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: ' test@test.com ', password: 'pass123' })
        .expect(400);
    });

    it('should handle product with zero stock', async () => {
      prisma.product.create.mockResolvedValue({
        id: 1,
        name: 'Out of Stock',
        price: 9.99,
        stock: 0,
      });

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${await createAdminToken()}`)
        .send({ name: 'Out of Stock', price: 9.99, stock: 0 })
        .expect(201);

      expect(response.body.stock).toBe(0);
    });

    it('should handle product with minimum positive price', async () => {
      prisma.product.create.mockResolvedValue({
        id: 1,
        name: 'Cheap',
        price: 0.01,
        stock: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${await createAdminToken()}`)
        .send({ name: 'Cheap', price: 0.01, stock: 1 })
        .expect(201);

      expect(response.body.price).toBe(0.01);
    });
  });

  describe('error handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app.getHttpServer())
        .get('/nonexistent')
        .expect(404);
    });

    it('should return 404 for unknown product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      const jwtService = moduleFixture.get(JwtService);
      const token = await jwtService.signAsync({ sub: 1, email: 'test@test.com', role: 'USER' });

      await request(app.getHttpServer())
        .get('/products/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should handle concurrent GET requests', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      const jwtService = moduleFixture.get(JwtService);
      const token = await jwtService.signAsync({ sub: 1, email: 'test@test.com', role: 'USER' });

      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${token}`),
      );

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });
  });

  async function createAdminToken(): Promise<string> {
    const jwtService = moduleFixture.get(JwtService);
    return jwtService.signAsync({ sub: 1, email: 'admin@test.com', role: 'ADMIN' });
  }
});
