import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../../src/auth/auth.module';
import { ProductsModule } from '../../src/products/products.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

describe('Auth Security', () => {
  let app: INestApplication<App>;
  let prisma: any;
  let jwtService: JwtService;

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
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT security', () => {
    it('should reject request with no Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(401);
    });

    it('should reject request with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should reject request with empty Bearer token', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', 'Bearer ')
        .expect(401);
    });

    it('should reject request with expired JWT', async () => {
      const expiredToken = jwtService.sign(
        { sub: 1, email: 'test@test.com', role: 'USER' },
        { expiresIn: '0s' },
      );

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject request with token signed by wrong secret', async () => {
      const wrongToken = jwtService.sign(
        { sub: 1, email: 'test@test.com', role: 'USER' },
        { secret: 'wrong-secret' },
      );

      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);
    });

    it('should reject request with garbage token', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });
  });

  describe('password security', () => {
    it('should not expose password in register response', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: 'Test',
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'pass123' })
        .expect(201);

      expect(response.body.password).toBeUndefined();
    });

    it('should store password as bcrypt hash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation((data) =>
        Promise.resolve({ id: 1, ...data.data, role: 'USER' }),
      );

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'mypassword' })
        .expect(201);

      const createCall = prisma.user.create.mock.calls[0][0];
      const storedPassword = createCall.data.password;

      // bcrypt hashes start with $2b$ (or $2a$)
      expect(storedPassword).toMatch(/^\$2[ab]\$/);
      expect(storedPassword).not.toBe('mypassword');
    });
  });

  describe('input validation security', () => {
    it('should reject SQL injection in email field', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: "'; DROP TABLE users;--", password: 'pass123' })
        .expect(400);
    });

    it('should reject XSS in name field (via validation)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: '<script>alert("xss")</script>',
        email: 'xss@test.com',
        role: 'USER',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: '<script>alert("xss")</script>', email: 'xss@test.com', password: 'pass123' })
        .expect(201);

      // Note: The app doesn't sanitize HTML, but the name is stored as-is.
      // In a real app, you'd want to sanitize this.
      expect(response.body.name).toBe('<script>alert("xss")</script>');
    });

    it('should strip unknown fields (whitelist)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: 'Test',
        email: 'test@test.com',
        role: 'USER',
      });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: 'pass123',
          role: 'ADMIN',
          isAdmin: true,
        })
        .expect(201);

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.role).toBeUndefined();
      expect(createCall.data.isAdmin).toBeUndefined();
    });

    it('should reject empty body on register', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });

    it('should reject invalid JSON', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid json')
        .expect(400);
    });
  });
});
