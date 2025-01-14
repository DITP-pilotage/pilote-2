import { PiloteError } from './pilote-error';

export class ForbiddenError extends PiloteError {

  constructor(message: string) {
    super({ message, code: 403, type: 'ForbiddenError' });
  }
}
