import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('validate', () => {
    it('should return user object from JWT payload', async () => {
      const payload = { sub: 1, email: 'test@example.com', role: 'USER' };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should map sub to id', async () => {
      const payload = { sub: 42, email: 'a@b.com', role: 'ADMIN' };

      const result = await strategy.validate(payload);

      expect(result.id).toBe(42);
      expect(result).not.toHaveProperty('sub');
    });
  });
});
