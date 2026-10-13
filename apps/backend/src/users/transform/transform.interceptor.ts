import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<{ status: string; data: unknown; timestamp: string }> {
    return next.handle().pipe(
      map((data) => {
        return {
          status: 'success',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
