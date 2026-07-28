import { LoggerMiddleware } from './logger.middleware';
import { Request, Response, NextFunction } from 'express';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should log method and URL', () => {
    const req = { method: 'GET', originalUrl: '/users' } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('GET /users');
  });

  it('should call next()', () => {
    const req = { method: 'POST', originalUrl: '/users/123' } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should log correct format for different methods', () => {
    const methods = ['GET', 'POST', 'PATCH', 'DELETE'];

    methods.forEach((method) => {
      const req = { method, originalUrl: '/test' } as Request;
      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      middleware.use(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(`${method} /test`);
    });
  });
});
