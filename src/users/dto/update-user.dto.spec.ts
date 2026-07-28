import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('should pass with empty object (all fields optional)', async () => {
    const dto = plainToInstance(UpdateUserDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only name', async () => {
    const dto = plainToInstance(UpdateUserDto, { name: 'Updated' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only email', async () => {
    const dto = plainToInstance(UpdateUserDto, { email: 'new@example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only password', async () => {
    const dto = plainToInstance(UpdateUserDto, { password: 'newpass123' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid email when provided', async () => {
    const dto = plainToInstance(UpdateUserDto, { email: 'bad' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with short password when provided', async () => {
    const dto = plainToInstance(UpdateUserDto, { password: '12345' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with all fields', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      name: 'Updated',
      email: 'updated@example.com',
      password: 'newpass123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
