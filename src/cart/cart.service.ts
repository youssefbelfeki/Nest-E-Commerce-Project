import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addItem(userId: number, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    if (product.stock < 1) {
      throw new BadRequestException(`Product "${product.name}" is out of stock`);
    }

    return this.prisma.$transaction(async (tx) => {
      let cart = await tx.cart.findUnique({ where: { userId } });

      if (!cart) {
        cart = await tx.cart.create({ data: { userId } });
      }

      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: cart.id, productId: dto.productId },
        },
      });

      if (existingItem) {
        const newQty = existingItem.quantity + dto.quantity;
        if (newQty > product.stock) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${existingItem.quantity}`,
          );
        }
        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty },
          include: { product: true },
        });
      }

      if (dto.quantity > product.stock) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
        include: { product: true },
      });
    });
  }

  async getCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      return { items: [] };
    }

    return cart;
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, product: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (dto.quantity > item.product.stock) {
      throw new BadRequestException(
        `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
}
