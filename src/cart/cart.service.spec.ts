import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let prisma: Record<string, any>;

  const userId = 1;
  const mockProduct = {
    id: 10,
    name: 'Test Product',
    price: 29.99,
    stock: 5,
    description: 'A test product',
    categoryId: 1,
    imageUrl: 'http://example.com/img.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCart = {
    id: 100,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartItem = {
    id: 200,
    cartId: mockCart.id,
    productId: mockProduct.id,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      cart: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      cartItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // addItem
  // ─────────────────────────────────────────────
  describe('addItem', () => {
    it('should add item to an empty cart', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const tx = {
        cart: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockCart),
        },
        cartItem: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockCartItem),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await service.addItem(userId, {
        productId: mockProduct.id,
        quantity: 2,
      });

      expect(tx.cart.create).toHaveBeenCalledWith({
        data: { userId },
      });
      expect(tx.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: mockCart.id,
          productId: mockProduct.id,
          quantity: 2,
        },
      });
      expect(result).toEqual(mockCartItem);
    });

    it('should add item when user already has a cart', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const existingCartItem = { ...mockCartItem, quantity: 1 };
      const tx = {
        cart: {
          findUnique: jest.fn().mockResolvedValue(mockCart),
        },
        cartItem: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockCartItem),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      await service.addItem(userId, {
        productId: mockProduct.id,
        quantity: 2,
      });

      expect(tx.cart.create).not.toHaveBeenCalled();
      expect(tx.cartItem.create).toHaveBeenCalled();
    });

    it('should increment quantity if item already exists in cart', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const existingCartItem = { ...mockCartItem, quantity: 2 };
      const updatedCartItem = { ...mockCartItem, quantity: 4 };
      const tx = {
        cart: {
          findUnique: jest.fn().mockResolvedValue(mockCart),
        },
        cartItem: {
          findUnique: jest.fn().mockResolvedValue(existingCartItem),
          update: jest.fn().mockResolvedValue(updatedCartItem),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await service.addItem(userId, {
        productId: mockProduct.id,
        quantity: 2,
      });

      expect(tx.cartItem.update).toHaveBeenCalledWith({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 2 },
      });
      expect(result).toEqual(updatedCartItem);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem(userId, { productId: 999, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product is out of stock (stock < 1)', async () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      prisma.product.findUnique.mockResolvedValue(outOfStockProduct);

      await expect(
        service.addItem(userId, { productId: mockProduct.id, quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if requested quantity exceeds stock', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const tx = {
        cart: {
          findUnique: jest.fn().mockResolvedValue(mockCart),
        },
        cartItem: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      await expect(
        service.addItem(userId, { productId: mockProduct.id, quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if combined quantity exceeds stock', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const existingCartItem = { ...mockCartItem, quantity: 4 };
      const tx = {
        cart: {
          findUnique: jest.fn().mockResolvedValue(mockCart),
        },
        cartItem: {
          findUnique: jest.fn().mockResolvedValue(existingCartItem),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      await expect(
        service.addItem(userId, { productId: mockProduct.id, quantity: 2 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // getCart
  // ─────────────────────────────────────────────
  describe('getCart', () => {
    it('should return cart with items', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };
      prisma.cart.findUnique.mockResolvedValue(cartWithItems);

      const result = await service.getCart(userId);

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual(cartWithItems);
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      await expect(service.getCart(userId)).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // updateItem
  // ─────────────────────────────────────────────
  describe('updateItem', () => {
    it('should update cart item quantity', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const updatedItem = { ...mockCartItem, quantity: 3 };
      prisma.cartItem.update.mockResolvedValue(updatedItem);

      const result = await service.updateItem(userId, mockCartItem.id, {
        quantity: 3,
      });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: mockCartItem.id },
        data: { quantity: 3 },
      });
      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem(userId, 1, { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateItem(userId, 999, { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if quantity exceeds stock', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.updateItem(userId, mockCartItem.id, { quantity: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new quantity is less than 1', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.updateItem(userId, mockCartItem.id, { quantity: 0 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────
  // removeItem
  // ─────────────────────────────────────────────
  describe('removeItem', () => {
    it('should remove cart item', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(mockCartItem);
      prisma.cartItem.delete.mockResolvedValue(mockCartItem);

      await service.removeItem(userId, mockCartItem.id);

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: mockCartItem.id },
      });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.removeItem(userId, mockCartItem.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      prisma.cart.findUnique.mockResolvedValue(mockCart);
      prisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeItem(userId, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
