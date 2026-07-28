import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a creation message', () => {
      const result = service.create({ name: 'Test', email: 'test@test.com', password: 'pass' });
      expect(result).toBe('This action adds a new user');
    });
  });

  describe('findAll', () => {
    it('should return all users message', () => {
      const result = service.findAll();
      expect(result).toBe('This action returns all users');
    });
  });

  describe('findOne', () => {
    it('should return user by id', () => {
      const result = service.findOne(1);
      expect(result).toBe('This action returns a #1 user');
    });

    it('should handle different ids', () => {
      const result = service.findOne(42);
      expect(result).toBe('This action returns a #42 user');
    });
  });

  describe('update', () => {
    it('should return update message', () => {
      const result = service.update(1, { name: 'Updated' });
      expect(result).toBe('This action updates a #1 user');
    });
  });

  describe('remove', () => {
    it('should return remove message', () => {
      const result = service.remove(1);
      expect(result).toBe('This action removes a #1 user');
    });
  });
});
