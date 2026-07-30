import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AuthGuard } from '../users/auth/auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  addItem(@User('id') userId: number, @Body(ValidationPipe) dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Get()
  getCart(@User('id') userId: number) {
    return this.cartService.getCart(userId);
  }

  @Patch('item/:id')
  updateItem(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, id, dto);
  }

  @Delete('item/:id')
  removeItem(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cartService.removeItem(userId, id);
  }
}
