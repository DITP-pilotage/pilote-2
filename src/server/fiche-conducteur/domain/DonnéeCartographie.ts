import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class DonnéeCartographie {
  private readonly _codeInsee: string;

  private readonly _tauxAvancement: number | null;

  private readonly _météo: Meteo;

  constructor({ codeInsee, tauxAvancement, météo }: {
    codeInsee: string,
    tauxAvancement: number | null,
    météo: Meteo
  }) {
    this._codeInsee = codeInsee;
    this._tauxAvancement = tauxAvancement;
    this._météo = météo;
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

  static creerDonnéeCartographie({ codeInsee, tauxAvancement, météo }: {
    codeInsee: string,
    tauxAvancement: number | null,
    météo: Meteo
  }) {
    return new DonnéeCartographie({ codeInsee, tauxAvancement, météo });
  }
}
