import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../users/auth/auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@User('id') userId: number, @Body(ValidationPipe) dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get()
  findAll(@User('id') userId: number) {
    return this.ordersService.findAll(userId);
  }

  @Get(':id')
  findOne(@User('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id, userId);
  }
}
