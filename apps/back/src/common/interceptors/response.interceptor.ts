import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Response } from 'express';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  T | ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<T | ApiResponse<T>> {
    // Nest must receive MessageEvent objects directly to serialize event/data/id.
    // Wrapping these in the normal JSON envelope would change the SSE protocol.
    if (Reflect.getMetadata(SSE_METADATA, context.getHandler())) {
      return next.handle();
    }
    const response: Response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    // Transforma el resultado de la llamada a la API en un mensaje SSE
    return next.handle().pipe(
      map((data: T) => ({
        statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}
