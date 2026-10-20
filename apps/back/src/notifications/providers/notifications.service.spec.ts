import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsNull, Repository } from 'typeorm';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationEntity, NotificationType } from '../notification.entity';
import { NotificationsRepositoryService } from './notifications-repository.service';
import { NotificationsService } from './notifications.service';

const input: CreateNotificationDto = {
  recipient_id: 7,
  recovery_id: null,
  type: NotificationType.RECOVERY_ACCEPTED,
  title: 'Recolección aceptada',
  message: 'Un recuperador aceptó tu solicitud.',
};
const entity = {
  ...input,
  id: '60d21177-1ae5-4b9b-b77c-e39f270c363d',
  created_at: new Date(),
  read_at: null,
  recipient: { id: 7, password: 'must-not-be-returned' },
  recovery: { description: 'Internal relation' },
} as unknown as NotificationEntity;

describe('Notifications DTOs and repository contracts', () => {
  const sql = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    countBy: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };
  const repository = new NotificationsRepositoryService(
    sql as unknown as Repository<NotificationEntity>,
  );
  const service = new NotificationsService(repository);
  beforeEach(() => {
    jest.resetAllMocks();
    sql.create.mockImplementation((data: unknown) => data);
    sql.save.mockResolvedValue(entity);
    sql.find.mockResolvedValue([entity]);
    sql.countBy.mockResolvedValue(1);
    sql.update.mockResolvedValue({ affected: 1 });
    sql.findOne.mockResolvedValue(entity);
  });

  it('returns the saved notification as a response DTO without loaded relations', async () => {
    const result = await service.create(input);
    expect(sql.create).toHaveBeenCalledWith({ ...input, read_at: null });
    expect(result).toBeInstanceOf(NotificationResponseDto);
    expect(result.id).toBe(entity.id);
    expect(Object.keys(result)).toEqual([
      'id',
      'recipient_id',
      'recovery_id',
      'type',
      'title',
      'message',
      'created_at',
      'read_at',
    ]);
    expect(JSON.stringify(result)).not.toContain('must-not-be-returned');
  });

  it('maps recipient history to DTOs and scopes the unread count', async () => {
    expect((await service.findForRecipient(7))[0]).toBeInstanceOf(
      NotificationResponseDto,
    );
    expect(sql.find).toHaveBeenCalledWith({
      where: { recipient_id: 7 },
      order: { created_at: 'DESC', id: 'DESC' },
      take: 50,
    });
    expect(await service.countUnread(7)).toBe(1);
    expect(sql.countBy).toHaveBeenCalledWith({
      recipient_id: 7,
      read_at: IsNull(),
    });
  });

  it('waits for the scoped update before reading and returning the DTO', async () => {
    let finishUpdate!: (value: { affected: number }) => void;
    sql.update.mockReturnValue(
      new Promise((resolve) => {
        finishUpdate = resolve;
      }),
    );
    const result = service.markAsRead(entity.id, 7);
    expect(sql.findOne).not.toHaveBeenCalled();
    expect(sql.update).toHaveBeenCalledWith(
      { id: entity.id, recipient_id: 7, read_at: IsNull() },
      { read_at: expect.any(Date) },
    );
    const firstRead = new Date('2026-10-17T12:00:00.000Z');
    sql.findOne.mockResolvedValue({ ...entity, read_at: firstRead });
    finishUpdate({ affected: 0 }); // Already read: preserve the existing timestamp.
    expect((await result).read_at).toEqual(firstRead);
    expect(sql.findOne).toHaveBeenCalledWith({
      where: { id: entity.id, recipient_id: 7 },
    });
  });

  it('reports missing notifications as 404', async () => {
    sql.update.mockResolvedValue({ affected: 0 });
    sql.findOne.mockResolvedValue(null);
    await expect(service.markAsRead(entity.id, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('propagates repository update failures instead of reading prematurely', async () => {
    sql.update.mockRejectedValue(new Error('Database update failed'));
    await expect(service.markAsRead(entity.id, 7)).rejects.toThrow(
      'Database update failed',
    );
    expect(sql.findOne).not.toHaveBeenCalled();
  });

  it('validates create input and accepts a missing or null recovery ID', () => {
    for (const recovery_id of [null, undefined, entity.id]) {
      const dto = plainToInstance(CreateNotificationDto, {
        ...input,
        recovery_id,
        title: '  Título  ',
      });
      expect(validateSync(dto)).toEqual([]);
      expect(dto.title).toBe('Título');
    }
  });

  it.each([
    { recipient_id: 0 },
    { recipient_id: 1.5 },
    { recovery_id: 'invalid' },
    { type: 'invented' },
    { title: '   ' },
    { title: 'a'.repeat(151) },
    { message: 'a'.repeat(501) },
  ])('rejects invalid input %j', (invalid) => {
    expect(
      validateSync(
        plainToInstance(CreateNotificationDto, { ...input, ...invalid }),
      ).length,
    ).toBeGreaterThan(0);
  });
});
