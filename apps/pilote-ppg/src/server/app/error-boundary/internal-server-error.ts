import { PiloteError } from "./pilote-error";

export class InternalServerError extends PiloteError {
  constructor(message: string) {
    super({ message, code: 500, type: "InternalServerError" });
  }
}
