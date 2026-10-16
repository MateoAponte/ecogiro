import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class ApiSuccessResponseBase<T> {
  statusCode: number;
  message: string;
  data: T;
}

export function ApiSuccessResponseDto<T>(
  dto: Type<T>,
): Type<ApiSuccessResponseBase<T>> {
  class ApiSuccessResponse implements ApiSuccessResponseBase<T> {
    @ApiProperty({ example: 200 })
    statusCode: number;

    @ApiProperty({ example: 'Success' })
    message: string;

    @ApiProperty({ type: () => dto })
    data: T;
  }

  Object.defineProperty(ApiSuccessResponse, 'name', {
    value: `ApiSuccessResponse_${dto.name}`,
  });

  return ApiSuccessResponse;
}
