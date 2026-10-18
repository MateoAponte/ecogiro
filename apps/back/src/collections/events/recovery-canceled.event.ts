export class RecoveryCanceledEvent {
  static readonly eventName = 'recovery.canceled';
  constructor(
    public readonly recovery_id: string,
    public readonly user_id: number,
    public readonly agent_id: number,
    public readonly canceled_by: number,
  ) {}
}
