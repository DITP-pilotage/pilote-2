import { PiloteError } from './pilote-error';

export class NotFoundError extends PiloteError {

  constructor(message: string) {
    super({ message, code: 404, type: 'NotFoundError' });
  }
}
