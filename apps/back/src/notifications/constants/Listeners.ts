import { NotificationType } from '../notification.entity';

export const LISTENERS_CONTENT = {
  [NotificationType.RECOVERY_ACCEPTED]: {
    message: 'Un recuperador aceptó tu solicitud de recolección.',
    title: 'Recolección aceptada',
    type: NotificationType.RECOVERY_ACCEPTED,
  },
  [NotificationType.RECOVERY_REJECTED]: {
    message: 'Un recuperador rechazó tu solicitud de recolección.',
    title: 'Recolección rechazada',
    type: NotificationType.RECOVERY_REJECTED,
  },
  [NotificationType.RECOVERY_COMPLETED]: {
    message: 'Tu recolección ha sido completada.',
    title: 'Recolección completada',
    type: NotificationType.RECOVERY_COMPLETED,
  },
};
