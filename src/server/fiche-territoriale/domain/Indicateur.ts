export class Indicateur {
  private readonly _dateValeurActuelle: string;

  private constructor({ dateValeurActuelle }: { dateValeurActuelle: string }) {
    this._dateValeurActuelle = dateValeurActuelle;
  }

  get dateValeurActuelle(): string {
    return this._dateValeurActuelle;
  }

  static creerIndicateur({ dateValeurActuelle }: { dateValeurActuelle: string }) {
    return new Indicateur({ dateValeurActuelle });
  }
}
