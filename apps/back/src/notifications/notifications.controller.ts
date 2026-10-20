import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import type { IAuthRequest } from '../auth/interfaces/IAuthRequest';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsService } from './providers/notifications.service';
import { NotificationsStreamService } from './providers/notifications-stream.service';

@Controller('notifications')
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly streams: NotificationsStreamService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get the latest 50 notifications for the authenticated user',
  })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  findForRecipient(
    @Req() request: IAuthRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notifications.findForRecipient(this.recipientId(request));
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Count unread notifications for the authenticated user',
  })
  @ApiOkResponse({ type: Number })
  countUnread(@Req() request: IAuthRequest): Promise<number> {
    return this.notifications.countUnread(this.recipientId(request));
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark one of the authenticated user notifications as read',
  })
  @ApiOkResponse({ type: NotificationResponseDto })
  markAsRead(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new BadRequestException('Not valid ID'),
      }),
    )
    id: string,
    @Req() request: IAuthRequest,
  ): Promise<NotificationResponseDto> {
    return this.notifications.markAsRead(id, this.recipientId(request));
  }

  @Sse('stream')
  stream(@Req() request: IAuthRequest): Observable<MessageEvent> {
    return this.streams.connect(this.recipientId(request));
  }

  private recipientId(request: IAuthRequest): number {
    const id = request.user?.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
      throw new UnauthorizedException('Invalid user');
    }
    return id;
  }
}
