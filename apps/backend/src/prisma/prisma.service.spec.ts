import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockPoolEnd = jest.fn().mockResolvedValue(undefined);

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: mockPoolEnd,
  })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../generated/prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      $connect = mockConnect;
      $disconnect = mockDisconnect;
    },
  };
});

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      await service.onModuleInit();
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect and pool.end', async () => {
      await service.onModuleDestroy();
      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockPoolEnd).toHaveBeenCalled();
    });
  });
});
