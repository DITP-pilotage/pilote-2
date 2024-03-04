export class Ministere {
  private readonly _icone: string;

  private readonly _code: string;

  private constructor({ icone, code }: { icone: string, code: string }) {
    this._icone = icone;
    this._code = code;
  }

  get icone(): string {
    return this._icone;
  }

  get code(): string {
    return this._code;
  }

  static creerMinistere({ icone, code }: { icone: string, code: string }) {
    return new Ministere({ icone, code });
  }
}
