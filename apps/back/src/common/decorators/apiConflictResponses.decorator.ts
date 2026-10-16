import { applyDecorators, HttpStatus } from '@nestjs/common';
import { buildErrorResponseExample } from '../helpers/buildErrorResponseExample';
import { ApiErrorResponse } from '../dto';
import { ApiConflictResponse } from '@nestjs/swagger';

export const ApiConflictResponses = (path: string): MethodDecorator =>
  applyDecorators(
    ApiConflictResponse({
      type: ApiErrorResponse,
      example: {
        ...buildErrorResponseExample(
          HttpStatus.CONFLICT,
          'The resource already exists',
          path,
        ),
      },
    }),
  );
