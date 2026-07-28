import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma/client';

export interface CreateUserFactoryInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export async function createTestUser(
  prisma: PrismaService,
  input: CreateUserFactoryInput = {},
) {
  const data = {
    name: input.name ?? 'Test User',
    email: input.email ?? `user-${Date.now()}@example.com`,
    password: input.password ?? 'password123',
    role: input.role ?? Role.USER,
  };

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });
}

export async function createTestAdmin(prisma: PrismaService) {
  return createTestUser(prisma, { role: Role.ADMIN, email: `admin-${Date.now()}@example.com` });
}
