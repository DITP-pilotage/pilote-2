export class TokenAPIInformation {
  private readonly _email: string;

  private readonly _dateCreation: string;

  private constructor({ email, dateCreation }: { email: string, dateCreation: string }) {
    this._email = email;
    this._dateCreation = dateCreation;
  }

  get email(): string {
    return this._email;
  }

  get dateCreation(): string {
    return this._dateCreation;
  }

  static creerTokenAPIInformation({ email, dateCreation }: { email: string, dateCreation: string }) {
    return new TokenAPIInformation({ email, dateCreation });
  }
}
