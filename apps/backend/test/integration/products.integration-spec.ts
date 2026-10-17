import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('Products Integration', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (promises: any[]) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD operations', () => {
    const mockProduct = { id: 1, name: 'Widget', price: 9.99, stock: 50 };

    it('should create a product', async () => {
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create({
        name: 'Widget',
        price: 9.99,
        stock: 50,
      });

      expect(result).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
    });

    it('should return paginated products', async () => {
      const products = [mockProduct];
      prisma.product.findMany.mockResolvedValue(products);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll(1, 16);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.count).toHaveBeenCalledTimes(1);
    });

    it('should find product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProduct);
    });

    it('should update product after verifying existence', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated',
      });

      const result = await service.update(1, { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(prisma.product.findUnique).toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalled();
      const findUniqueOrder =
        prisma.product.findUnique.mock.invocationCallOrder[0];
      const updateOrder = prisma.product.update.mock.invocationCallOrder[0];
      expect(findUniqueOrder).toBeLessThan(updateOrder);
    });

    it('should delete product after verifying existence', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove(1);

      expect(result).toEqual(mockProduct);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('not found scenarios', () => {
    it('should throw NotFoundException for non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should not update non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should not delete non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });
});
