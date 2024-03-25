import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class DonnéeCartographie {
  private readonly _codeInsee: string;

  private readonly _tauxAvancement: number | null;

  private readonly _météo: Meteo;

  private readonly _estApplicable: boolean;

  constructor({ codeInsee, tauxAvancement, météo, estApplicable }: {
    codeInsee: string,
    tauxAvancement: number | null,
    météo: Meteo
    estApplicable: boolean
  }) {
    this._codeInsee = codeInsee;
    this._tauxAvancement = tauxAvancement;
    this._météo = météo;
    this._estApplicable = estApplicable;
  }


  get codeInsee(): string {
    return this._codeInsee;
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

  static creerDonnéeCartographie({ codeInsee, tauxAvancement, météo, estApplicable }: {
    codeInsee: string,
    tauxAvancement: number | null,
    météo: Meteo
    estApplicable: boolean
  }) {
    return new DonnéeCartographie({ codeInsee, tauxAvancement, météo, estApplicable });
  }
}
