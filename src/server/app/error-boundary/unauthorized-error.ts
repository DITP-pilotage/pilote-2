import { PiloteError } from './pilote-error';

export class UnauthorizedError extends PiloteError {

  constructor(message: string) {
    super({ message, code: 401, type: 'UnauthorizedError' });
  }
}
