import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

describe('CreateProductDto', () => {
  const validData = {
    name: 'Test Product',
    price: 29.99,
    stock: 100,
  };

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateProductDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('name', () => {
    it('should fail when name is missing', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, name: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when name is empty string', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, name: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when name is not a string', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, name: 123 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('price', () => {
    it('should fail when price is missing', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, price: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with negative price', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, price: -10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with zero price', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, price: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass with minimum positive price', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, price: 0.01 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when price is not a number', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, price: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('stock', () => {
    it('should fail when stock is missing', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, stock: undefined });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with negative stock', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, stock: -1 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should pass with zero stock', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, stock: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with non-integer stock', async () => {
      const dto = plainToInstance(CreateProductDto, { ...validData, stock: 10.5 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
