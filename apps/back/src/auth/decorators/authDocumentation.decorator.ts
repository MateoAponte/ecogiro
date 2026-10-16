import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ApiErrorServerResponses } from 'src/common/decorators';
import { ApiSuccessResponseDto } from 'src/common/dto';

export const LoginDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiOkResponse({
      description: 'Returns JWT token.',
      type: ApiSuccessResponseDto(Response),
      example: {
        statusCode: HttpStatus.OK,
        data: {
          at_secret:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          rt_secret:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
        message: 'Success',
      },
    }),
    ApiErrorServerResponses('user/:id'),
  );

export const RefreshDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiOkResponse({
      description: 'Returns JWT token.',
      type: ApiSuccessResponseDto(Response),
      example: {
        statusCode: HttpStatus.OK,
        data: {
          at_secret:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          rt_secret:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
        message: 'Success',
      },
    }),
    ApiErrorServerResponses('auth/refresh'),
  );
