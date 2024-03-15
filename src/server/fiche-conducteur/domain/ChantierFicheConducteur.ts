import { IndicateurFicheConducteur } from '@/server/fiche-conducteur/domain/IndicateurFicheConducteur';

export class ChantierFicheConducteur {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _listeDirecteursAdministrationCentrale: string[];

  private readonly _listeDirecteursProjet: string[];

  private readonly _indicateurs: IndicateurFicheConducteur[];

  private constructor({ id, nom, listeDirecteursAdministrationCentrale, listeDirecteursProjet, indicateurs }: { id: string, nom: string, listeDirecteursAdministrationCentrale: string[], listeDirecteursProjet: string[], indicateurs: IndicateurFicheConducteur[] }) {
    this._id = id;
    this._nom = nom;
    this._listeDirecteursAdministrationCentrale = listeDirecteursAdministrationCentrale;
    this._listeDirecteursProjet = listeDirecteursProjet;
    this._indicateurs = indicateurs;
  }

  get id(): string {
    return this._id;
  }

  get nom(): string {
    return this._nom;
  }

  get listeDirecteursAdministrationCentrale(): string[] {
    return this._listeDirecteursAdministrationCentrale;
  }

  get listeDirecteursProjet(): string[] {
    return this._listeDirecteursProjet;
  }

  get indicateurs(): IndicateurFicheConducteur[] {
    return this._indicateurs;
  }

  static creerChantierFicheConducteur({ id, nom, listeDirecteursAdministrationCentrale, listeDirecteursProjet, indicateurs }: { id: string, nom: string, listeDirecteursAdministrationCentrale: string[], listeDirecteursProjet: string[], indicateurs: IndicateurFicheConducteur[]  }) {
    return new ChantierFicheConducteur({ id, nom, listeDirecteursAdministrationCentrale, listeDirecteursProjet, indicateurs });
  }
}
