import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const spy = jest.spyOn(service, 'create');
      await controller.create({
        name: 'Test',
        email: 'test@test.com',
        password: 'pass',
      });
      expect(spy).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@test.com',
        password: 'pass',
      });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const spy = jest.spyOn(service, 'findAll');
      await controller.findAll();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      const spy = jest.spyOn(service, 'findOne');
      await controller.findOne(5);
      expect(spy).toHaveBeenCalledWith(5);
    });
  });

  describe('update', () => {
    it('should call service.update with parsed id and dto', async () => {
      const spy = jest.spyOn(service, 'update');
      await controller.update(3, { name: 'Updated' });
      expect(spy).toHaveBeenCalledWith(3, { name: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      const spy = jest.spyOn(service, 'remove');
      await controller.remove(7);
      expect(spy).toHaveBeenCalledWith(7);
    });
  });
});
