import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({
    example: HttpStatus.BAD_REQUEST,
    enum: HttpStatus,
    enumName: 'HttpStatus',
  })
  statusCode: HttpStatus;

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiProperty({ example: '/api/v1/user' })
  path: string;

  @ApiProperty({ example: '2026-03-20T19:00:00.000Z' })
  timestamp: string;
}
