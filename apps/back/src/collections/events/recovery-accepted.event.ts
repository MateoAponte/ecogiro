// A completed business action. This contract does not create notifications.
export class RecoveryAcceptedEvent {
  static readonly eventName = 'recovery.accepted';

  constructor(
    public readonly recovery_id: string,
    public readonly user_id: number,
    public readonly agent_id: number,
  ) {}
}
