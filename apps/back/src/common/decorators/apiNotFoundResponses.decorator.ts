import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { ApiErrorResponse } from '../dto/ApiErrorResponse';
import { buildErrorResponseExample } from '../helpers/buildErrorResponseExample';

export const ApiNotFoundResponses = (path: string): MethodDecorator =>
  applyDecorators(
    ApiNotFoundResponse({
      type: ApiErrorResponse,
      example: {
        ...buildErrorResponseExample(
          HttpStatus.NOT_FOUND,
          'Resource not Found',
          path,
        ),
      },
    }),
  );
