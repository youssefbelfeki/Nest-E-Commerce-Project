import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable, timestamp } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => {
      return {
        status: 'success',
        data,
        timestamp: new Date().toISOString(),
      }
    }))
  }
}
