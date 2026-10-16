// src/common/decorators/api-response.decorator.ts
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponse } from '../dto/ApiErrorResponse';
import { buildErrorResponseExample } from '../helpers/buildErrorResponseExample';

export const ApiAuthResponses = (path: string): MethodDecorator =>
  applyDecorators(
    ApiForbiddenResponse({
      type: ApiErrorResponse,
      example: {
        ...buildErrorResponseExample(
          HttpStatus.FORBIDDEN,
          'Forbidden, some credentials are missing or invalid format',
          path,
        ),
      },
    }),
    ApiUnauthorizedResponse({
      type: ApiErrorResponse,
      example: {
        ...buildErrorResponseExample(
          HttpStatus.UNAUTHORIZED,
          'Unauthorized',
          path,
        ),
      },
    }),
  );
