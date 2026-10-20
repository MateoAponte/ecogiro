export class RecoveryCompletedEvent {
  static readonly eventName = 'recovery.completed';
  constructor(
    public readonly recovery_id: string,
    public readonly user_id: number,
    public readonly agent_id: number,
  ) {}
}
