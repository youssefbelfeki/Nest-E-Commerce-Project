import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  const validData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateUserDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('name', () => {
    it('should fail when name is missing', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, name: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when name is empty string', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when name is not a string', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, name: 123 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('email', () => {
    it('should fail when email is missing', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, email: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email format', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, email: 'not-an-email' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('password', () => {
    it('should fail when password is missing', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, password: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when password is less than 6 characters', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, password: '12345' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass with password of exactly 6 characters', async () => {
      const dto = plainToInstance(CreateUserDto, { ...validData, password: '123456' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
