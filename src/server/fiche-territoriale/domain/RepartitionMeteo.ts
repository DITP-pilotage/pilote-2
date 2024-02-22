export class RepartitionMeteo {
  private readonly _nombreCouvert: number;

  private readonly _nombreNuage: number;

  private readonly _nombreOrage: number;

  private readonly _nombreSoleil: number;

  private constructor({ nombreCouvert, nombreNuage, nombreOrage, nombreSoleil }: { nombreCouvert: number, nombreNuage: number, nombreOrage: number, nombreSoleil: number }) {
    this._nombreCouvert = nombreCouvert;
    this._nombreNuage = nombreNuage;
    this._nombreOrage = nombreOrage;
    this._nombreSoleil = nombreSoleil;
  }


  get nombreCouvert(): number {
    return this._nombreCouvert;
  }

  get nombreNuage(): number {
    return this._nombreNuage;
  }

  get nombreOrage(): number {
    return this._nombreOrage;
  }

  get nombreSoleil(): number {
    return this._nombreSoleil;
  }

  static creerRepartitionMeteo({ nombreCouvert, nombreNuage, nombreOrage, nombreSoleil }: { nombreCouvert: number, nombreNuage: number, nombreOrage: number, nombreSoleil: number }) {
    return new RepartitionMeteo({
      nombreCouvert,
      nombreNuage,
      nombreOrage,
      nombreSoleil,
    });
  }
}
