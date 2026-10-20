import {
  apiCreateRecovery,
  apiUpdateUserEcoPoints,
  type CreateRecoveryRequest,
} from './recoveries-api';

// Keeps a successful POST when PATCH fails so a retry on this screen cannot create
// another recovery or add the same points twice.
export class RecoveryConfirmation {
  private pending: { userId: number; total: number } | null = null;
  private completed = false;
  private inFlight = false;

  get recoveryCreated() {
    return this.pending !== null;
  }

  async confirm(
    recovery: CreateRecoveryRequest,
    currentPoints: number,
    earnedPoints: number,
  ): Promise<number> {
    if (this.inFlight) throw new Error('La solicitud se está enviando.');
    if (
      ![currentPoints, earnedPoints, currentPoints + earnedPoints].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      )
    ) {
      throw new Error('Los puntos de la solicitud no son válidos.');
    }
    if (this.pending && this.pending.userId !== recovery.user_id)
      throw new Error('La solicitud pertenece a otra sesión.');
    this.inFlight = true;
    try {
      if (!this.pending) {
        await apiCreateRecovery(recovery);
        this.pending = { userId: recovery.user_id, total: currentPoints + earnedPoints };
      }
      if (!this.completed) {
        await apiUpdateUserEcoPoints(this.pending.userId, this.pending.total);
        this.completed = true;
      }
      return this.pending.total;
    } finally {
      this.inFlight = false;
    }
  }
}
