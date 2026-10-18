// A completed business action. This contract does not create notifications.
export class RecoveryRejectedEvent {
  static readonly eventName = 'recovery.rejected';

  constructor(
    public readonly recovery_id: string,
    public readonly user_id: number,
    public readonly agent_id: number,
  ) {}
}
