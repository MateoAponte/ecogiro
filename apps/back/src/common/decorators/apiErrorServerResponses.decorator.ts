import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ApiErrorResponse } from '../dto/ApiErrorResponse';
import { buildErrorResponseExample } from '../helpers/buildErrorResponseExample';

export const ApiErrorServerResponses = (path: string): MethodDecorator =>
  applyDecorators(
    ApiBadRequestResponse({
      type: ApiErrorResponse,
      example: {
        ...buildErrorResponseExample(
          HttpStatus.BAD_REQUEST,
          'Bad Request',
          path,
        ),
      },
    }),
    ApiInternalServerErrorResponse({
      type: ApiErrorResponse,
      example: {
        ...buildErrorResponseExample(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Something went wrong',
          path,
        ),
      },
    }),
  );
