import { Meteo } from "@/server/fiche-conducteur/domain/Meteo";

export class DonnéeCartographie {
  private readonly _territoireCode: string;

  private readonly _tauxAvancement: number | null;

  private readonly _météo: Meteo;

  private readonly _estApplicable: boolean;

  constructor({
    territoireCode,
    tauxAvancement,
    météo,
    estApplicable,
  }: {
    territoireCode: string;
    tauxAvancement: number | null;
    météo: Meteo;
    estApplicable: boolean;
  }) {
    this._territoireCode = territoireCode;
    this._tauxAvancement = tauxAvancement;
    this._météo = météo;
    this._estApplicable = estApplicable;
  }

  get territoireCode(): string {
    return this._territoireCode;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get météo(): Meteo {
    return this._météo;
  }

  get estApplicable(): boolean {
    return this._estApplicable;
  }

  static creerDonnéeCartographie({
    territoireCode,
    tauxAvancement,
    météo,
    estApplicable,
  }: {
    territoireCode: string;
    tauxAvancement: number | null;
    météo: Meteo;
    estApplicable: boolean;
  }) {
    return new DonnéeCartographie({
      territoireCode,
      tauxAvancement,
      météo,
      estApplicable,
    });
  }
}
