import { PiloteError } from "@/server/app/error-boundary/pilote-error";

export class ConflictError extends PiloteError {
  constructor(message: string) {
    super({ message, code: 409, type: "ConflictError" });
  }
}
