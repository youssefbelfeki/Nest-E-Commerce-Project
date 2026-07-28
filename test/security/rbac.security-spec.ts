import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../../src/auth/auth.module';
import { ProductsModule } from '../../src/products/products.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

describe('RBAC Security', () => {
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

  describe('admin access', () => {
    it('should allow admin to create product', async () => {
      prisma.product.create.mockResolvedValue(mockProduct);

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(201);
    });

    it('should allow admin to update product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated' });

      await request(app.getHttpServer())
        .patch('/products/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(200);
    });

    it('should allow admin to delete product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      await request(app.getHttpServer())
        .delete('/products/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('user access denied', () => {
    it('should deny user from creating product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(403);

      expect(response.body.message).toContain('not authorized');
    });

    it('should deny user from updating product', async () => {
      const response = await request(app.getHttpServer())
        .patch('/products/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated' })
        .expect(403);

      expect(response.body.message).toContain('not authorized');
    });

    it('should deny user from deleting product', async () => {
      const response = await request(app.getHttpServer())
        .delete('/products/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toContain('not authorized');
    });

    it('should include role info in error message', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(403);

      expect(response.body.message).toContain('USER');
    });
  });

  describe('unauthenticated access denied', () => {
    it('should deny all product mutations without token', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Widget', price: 9.99, stock: 50 })
        .expect(401);

      await request(app.getHttpServer())
        .patch('/products/1')
        .send({ name: 'Updated' })
        .expect(401);

      await request(app.getHttpServer())
        .delete('/products/1')
        .expect(401);
    });

    it('should deny product reads without token', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });
  });
});
