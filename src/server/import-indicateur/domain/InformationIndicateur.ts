export class InformationIndicateur {
  private readonly _indicId: string;

  private readonly _indicSchema: string;

  private constructor({ indicId, indicSchema }: { indicId: string, indicSchema: string }) {
    this._indicId = indicId;
    this._indicSchema = indicSchema;
  }


  get indicId(): string {
    return this._indicId;
  }

  get indicSchema(): string {
    return this._indicSchema;
  }

  static creerInformationIndicateur({ indicId, indicSchema }: { indicId: string, indicSchema: string }) {
    return new InformationIndicateur({ indicId, indicSchema });
  }
}
