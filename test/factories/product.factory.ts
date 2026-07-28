import { PrismaService } from '../../src/prisma/prisma.service';

export interface CreateProductFactoryInput {
  name?: string;
  price?: number;
  stock?: number;
}

export async function createTestProduct(
  prisma: PrismaService,
  input: CreateProductFactoryInput = {},
) {
  return prisma.product.create({
    data: {
      name: input.name ?? `Product-${Date.now()}`,
      price: input.price ?? 29.99,
      stock: input.stock ?? 100,
    },
  });
}
