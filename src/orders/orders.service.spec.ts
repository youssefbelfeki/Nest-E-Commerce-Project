import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let tx: any;

  const mockUserId = 1;
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 29.99,
    stock: 10,
    createdAt: new Date(),
  };

  const mockOrderItem = {
    id: 1,
    orderId: 1,
    productId: 1,
    quantity: 2,
    product: mockProduct,
  };

  const mockOrder = {
    id: 1,
    userId: mockUserId,
    createdAt: new Date(),
    items: [mockOrderItem],
  };

  beforeEach(async () => {
    tx = {
      product: { update: jest.fn() },
      order: { create: jest.fn() },
    };

    prisma = {
      product: {
        findMany: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    const createOrderDto = {
      items: [{ productId: 1, quantity: 2 }],
    };

    function mockTransaction() {
      prisma.$transaction.mockImplementation(
        async (cb: (tx: any) => Promise<any>) => cb(tx),
      );
      tx.order.create.mockResolvedValue(mockOrder);
    }

    it('should create an order successfully', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      mockTransaction();

      const result = await service.create(mockUserId, createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when product not found', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow('Product with ID 1 not found');
    });

    it('should throw BadRequestException when product missing from results', async () => {
      prisma.product.findMany.mockResolvedValue([
        { ...mockProduct, id: 999 },
      ]);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow('Product with ID 1 not found');
    });

    it('should throw BadRequestException when stock insufficient', async () => {
      prisma.product.findMany.mockResolvedValue([
        { ...mockProduct, stock: 1 },
      ]);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(
        'Insufficient stock for product "Test Product". Available: 1, requested: 2',
      );
    });

    it('should call product.update to decrement stock', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      mockTransaction();

      await service.create(mockUserId, createOrderDto);

      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { decrement: 2 } },
      });
    });

    it('should call order.create with correct data', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      mockTransaction();

      await service.create(mockUserId, createOrderDto);

      expect(tx.order.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          items: {
            create: [{ productId: 1, quantity: 2 }],
          },
        },
        include: { items: { include: { product: true } } },
      });
    });
  });

  describe('findAll', () => {
    it('should return orders filtered by userId', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual([mockOrder]);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no orders exist', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return order when found and owned by user', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findOne(1, mockUserId);

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUserId },
        include: { items: { include: { product: true } } },
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(999, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(999, mockUserId),
      ).rejects.toThrow('Order with ID 999 not found');
    });

    it('should throw NotFoundException when order belongs to another user', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(1, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(1, mockUserId),
      ).rejects.toThrow('Order with ID 1 not found');
    });
  });
});
