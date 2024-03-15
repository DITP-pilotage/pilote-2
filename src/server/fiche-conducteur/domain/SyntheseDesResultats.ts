import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class SyntheseDesResultats {
  private readonly _meteo: Meteo | null;

  private readonly _commentaire: string;

  private constructor({ meteo, commentaire }: { meteo: Meteo | null, commentaire: string }) {
    this._meteo = meteo;
    this._commentaire = commentaire;
  }

  get meteo(): Meteo | null {
    return this._meteo;
  }

  get commentaire(): string {
    return this._commentaire;
  }

  static creerSyntheseDesResultats({ meteo, commentaire }: { meteo: Meteo | null, commentaire: string }) {
    return new SyntheseDesResultats({ meteo, commentaire });
  }
}
