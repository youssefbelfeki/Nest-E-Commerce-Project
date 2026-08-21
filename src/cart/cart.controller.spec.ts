import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '../users/auth/auth.guard';

const mockUserId = 1;
const mockCartItemId = 10;

const mockCartItem = {
  id: mockCartItemId,
  cartId: 1,
  productId: 5,
  quantity: 2,
  product: { id: 5, name: 'Widget', price: 29.99, stock: 50 },
};

const mockCart = {
  id: 1,
  userId: mockUserId,
  items: [mockCartItem],
};

const mockCartService = {
  addItem: jest.fn(),
  getCart: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
};

describe('CartController', () => {
  let controller: CartController;
  let service: typeof mockCartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: mockCartService }],
    }).overrideGuard(AuthGuard).useValue({ canActivate: () => true }).compile();

    controller = module.get<CartController>(CartController);
    service = module.get<typeof mockCartService>(CartService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /cart/add', () => {
    it('should add item to cart', async () => {
      const dto: AddToCartDto = { productId: 5, quantity: 2 };
      service.addItem.mockResolvedValue(mockCartItem);

      const result = await controller.addItem(mockUserId, dto);

      expect(result).toEqual(mockCartItem);
      expect(service.addItem).toHaveBeenCalledWith(mockUserId, dto);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const dto: AddToCartDto = { productId: 999, quantity: 1 };
      service.addItem.mockRejectedValue(new NotFoundException());

      await expect(controller.addItem(mockUserId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /cart', () => {
    it('should return the user cart', async () => {
      service.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart(mockUserId);

      expect(result).toEqual(mockCart);
      expect(service.getCart).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw NotFoundException when cart is empty', async () => {
      service.getCart.mockRejectedValue(new NotFoundException());

      await expect(controller.getCart(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /cart/item/:id', () => {
    it('should update cart item quantity', async () => {
      const dto: UpdateCartItemDto = { quantity: 5 };
      const updatedItem = { ...mockCartItem, quantity: 5 };
      service.updateItem.mockResolvedValue(updatedItem);

      const result = await controller.updateItem(mockUserId, mockCartItemId, dto);

      expect(result).toEqual(updatedItem);
      expect(service.updateItem).toHaveBeenCalledWith(mockUserId, mockCartItemId, dto);
    });

    it('should throw NotFoundException when cart item not found', async () => {
      const dto: UpdateCartItemDto = { quantity: 5 };
      service.updateItem.mockRejectedValue(new NotFoundException());

      await expect(controller.updateItem(mockUserId, 999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /cart/item/:id', () => {
    it('should remove cart item', async () => {
      service.removeItem.mockResolvedValue(undefined);

      await controller.removeItem(mockUserId, mockCartItemId);

      expect(service.removeItem).toHaveBeenCalledWith(mockUserId, mockCartItemId);
    });

    it('should throw NotFoundException when cart item not found', async () => {
      service.removeItem.mockRejectedValue(new NotFoundException());

      await expect(controller.removeItem(mockUserId, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
