import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';

export class Chantier {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _meteo: MeteoDisponible | null;

  private readonly _codeMinisterePorteur: string;

  private readonly _tauxAvancement: number | null;

  private constructor({ id, tauxAvancement, meteo, nom, codeMinisterePorteur }: { id: string, tauxAvancement: number | null, meteo: MeteoDisponible | null, nom: string, codeMinisterePorteur: string }) {
    this._id = id;
    this._tauxAvancement = tauxAvancement;
    this._meteo = meteo;
    this._nom = nom;
    this._codeMinisterePorteur = codeMinisterePorteur;
  }

  get id(): string {
    return this._id;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get meteo(): MeteoDisponible | null {
    return this._meteo;
  }

  get nom(): string {
    return this._nom;
  }

  get codeMinisterePorteur(): string {
    return this._codeMinisterePorteur;
  }

  static creerChantier({ id, tauxAvancement, meteo, nom, codeMinisterePorteur }: { id: string, tauxAvancement: number | null, meteo: MeteoDisponible | null, nom: string, codeMinisterePorteur?: string }): Chantier {
    return new Chantier({ id, tauxAvancement, meteo, nom, codeMinisterePorteur: codeMinisterePorteur || '' });
  }
}
