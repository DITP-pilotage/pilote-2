import { PiloteError } from './pilote-error';

export class BadRequestError extends PiloteError {

  constructor(message: string) {
    super({ message, code: 400, type: 'BadRequestError' });
  }
}
