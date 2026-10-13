import { CallHandler, ExecutionContext } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should wrap response in standard format', (done) => {
      const context = {} as ExecutionContext;
      const callHandler: CallHandler = {
        handle: () => of({ name: 'test', value: 42 }),
      };

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result).toHaveProperty('status', 'success');
          expect(result).toHaveProperty('data');
          expect(result.data).toEqual({ name: 'test', value: 42 });
          expect(result).toHaveProperty('timestamp');
          done();
        },
      });
    });

    it('should include valid ISO timestamp', (done) => {
      const context = {} as ExecutionContext;
      const callHandler: CallHandler = {
        handle: () => of('hello'),
      };

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result.timestamp).toBeDefined();
          const date = new Date(result.timestamp);
          expect(date.toISOString()).toBe(result.timestamp);
          done();
        },
      });
    });

    it('should handle null data', (done) => {
      const context = {} as ExecutionContext;
      const callHandler: CallHandler = {
        handle: () => of(null),
      };

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result.status).toBe('success');
          expect(result.data).toBeNull();
          done();
        },
      });
    });

    it('should handle array data', (done) => {
      const context = {} as ExecutionContext;
      const callHandler: CallHandler = {
        handle: () => of([1, 2, 3]),
      };

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result.data).toEqual([1, 2, 3]);
          done();
        },
      });
    });

    it('should handle undefined data', (done) => {
      const context = {} as ExecutionContext;
      const callHandler: CallHandler = {
        handle: () => of(undefined),
      };

      interceptor.intercept(context, callHandler).subscribe({
        next: (result) => {
          expect(result.status).toBe('success');
          expect(result.data).toBeUndefined();
          done();
        },
      });
    });
  });
});
