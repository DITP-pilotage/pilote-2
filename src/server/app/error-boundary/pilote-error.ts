export class PiloteError extends Error {
  private readonly _message: string;

  private readonly _status: number;

  private readonly _type: string;

  constructor({
    message,
    code,
    type,
  }: {
    message: string;
    code: number;
    type: string;
  }) {
    super(message);
    this._message = message;
    this._status = code;
    this._type = type;
  }

  get message(): string {
    return this._message;
  }

  get status(): number {
    return this._status;
  }

  get type(): number {
    return this._status;
  }
}
