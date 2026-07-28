import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../../src/auth/auth.module';
import { ProductsModule } from '../../src/products/products.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

describe('Products E2E (mocked)', () => {
  let app: INestApplication<App>;
  let prisma: any;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;

  const mockProduct = { id: 1, name: 'Widget', price: 9.99, stock: 50 };

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

    jwtService = moduleFixture.get<JwtService>(JwtService);
    adminToken = await jwtService.signAsync({ sub: 1, email: 'admin@test.com', role: 'ADMIN' });
    userToken = await jwtService.signAsync({ sub: 2, email: 'user@test.com', role: 'USER' });
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    it('should return products with valid token', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /products/:id', () => {
    it('should return product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const response = await request(app.getHttpServer())
        .get('/products/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(1);
    });

    it('should return 404 for non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/products/999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('POST /products', () => {
    it('should create product as admin', async () => {
      prisma.product.create.mockResolvedValue(mockProduct);

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(201);

      expect(response.body.name).toBe('Widget');
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', price: -1, stock: 'abc' })
        .expect(400);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update product as admin', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated' });

      const response = await request(app.getHttpServer())
        .patch('/products/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body.name).toBe('Updated');
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .patch('/products/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated' })
        .expect(403);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product as admin', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      await request(app.getHttpServer())
        .delete('/products/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 403 for regular user', async () => {
      await request(app.getHttpServer())
        .delete('/products/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
