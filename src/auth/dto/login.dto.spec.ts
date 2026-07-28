import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const validData = {
    email: 'test@example.com',
    password: 'password123',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(LoginDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('email', () => {
    it('should fail when email is missing', async () => {
      const dto = plainToInstance(LoginDto, { ...validData, email: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(LoginDto, { ...validData, email: 'bad' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('password', () => {
    it('should fail when password is missing', async () => {
      const dto = plainToInstance(LoginDto, { ...validData, password: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass with any string password (no min length on login)', async () => {
      const dto = plainToInstance(LoginDto, { ...validData, password: 'a' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
