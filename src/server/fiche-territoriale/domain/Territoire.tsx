export class Territoire {
  private readonly _nomAffiché: string;

  private constructor({ nomAffiché }: { nomAffiché: string }) {
    this._nomAffiché = nomAffiché;
  }

  get nomAffiché(): string {
    return this._nomAffiché;
  }

  static creerTerritoire({ nomAffiché }: { nomAffiché: string }) {
    return new Territoire({ nomAffiché });
  }
}
