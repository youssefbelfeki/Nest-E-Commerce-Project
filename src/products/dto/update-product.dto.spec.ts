import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProductDto } from './update-product.dto';

describe('UpdateProductDto', () => {
  it('should pass with empty object (all fields optional)', async () => {
    const dto = plainToInstance(UpdateProductDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only name', async () => {
    const dto = plainToInstance(UpdateProductDto, { name: 'Updated' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only price', async () => {
    const dto = plainToInstance(UpdateProductDto, { price: 9.99 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only stock', async () => {
    const dto = plainToInstance(UpdateProductDto, { stock: 50 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid price when provided', async () => {
    const dto = plainToInstance(UpdateProductDto, { price: -5 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid stock when provided', async () => {
    const dto = plainToInstance(UpdateProductDto, { stock: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with all fields', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      name: 'Updated',
      price: 19.99,
      stock: 25,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
