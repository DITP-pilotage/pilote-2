export class PiloteError extends Error {
  private readonly _tag = "PiloteError";

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

  static isPiloteError(error: unknown): error is PiloteError {
    return (error as PiloteError)._tag === "PiloteError";
  }

  get message() {
    return this._message;
  }

  get status() {
    return this._status;
  }

  get type() {
    return this._type;
  }
}
