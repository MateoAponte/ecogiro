import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  ApiAuthResponses,
  ApiErrorServerResponses,
  ApiNotFoundResponses,
} from 'src/common/decorators';
import { UserResponseDto } from '../dto/user-response.dto';
import { ApiSuccessResponseDto } from 'src/common/dto';
import { ApiConflictResponses } from 'src/common/decorators/apiConflictResponses.decorator';

export const GetUserDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiOkResponse({
      description: 'Returns a user by id.',
      type: ApiSuccessResponseDto(UserResponseDto),
    }),
    ApiAuthResponses('user/:id'),
    ApiNotFoundResponses('user/:id'),
    ApiErrorServerResponses('user/:id'),
  );

export const GetAllUsersDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiOkResponse({
      type: ApiSuccessResponseDto(Array<UserResponseDto>),
      example: {
        statusCode: HttpStatus.CREATED,
        description: 'Returns an array of users.',
        value: [
          {
            id: 'd3f0ffc6-b449-4435-ae39-af258cf4d1b5',
            name: 'John Doe',
            email: 'john@example.com',
            rol: 1,
            activities: [1],
          },
          {
            id: 'ba0b137d-bc57-4eb1-9600-2704bf72fd2e',
            name: 'Foo Bar',
            email: 'foo@example.com',
            rol: 0,
            activities: [1, 2],
          },
        ],
      },
    }),
    ApiAuthResponses('user'),
    ApiNotFoundResponses('user'),
    ApiErrorServerResponses('user'),
  );

export const CreateUserDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiCreatedResponse({
      description: 'Create a new user.',
      type: ApiSuccessResponseDto(UserResponseDto),
    }),
    ApiAuthResponses('user'),
    ApiNotFoundResponses('user'),
    ApiConflictResponses('user'),
    ApiErrorServerResponses('user'),
  );

export const UpdateUserDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiNoContentResponse({
      description: 'User updated successfully.',
    }),
    ApiAuthResponses('user/:id'),
    ApiNotFoundResponses('user/:id'),
    ApiErrorServerResponses('user/:id'),
  );

export const DeleteUserDocumentation = (): MethodDecorator =>
  applyDecorators(
    ApiNoContentResponse({
      description: 'User deleted successfully.',
    }),
    ApiAuthResponses('user/:id'),
    ApiNotFoundResponses('user/:id'),
    ApiErrorServerResponses('user/:id'),
  );
