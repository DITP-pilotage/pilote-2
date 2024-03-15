import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class Chantier {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _tauxAvancement: number | null;

  private readonly _maille: string;

  private readonly _codeInsee: string;

  private readonly _meteo: string;

  private readonly _listeDirecteursAdministrationCentrale: string[];

  private readonly _listeDirecteursProjet: string[];

  private constructor({ id, nom, tauxAvancement, maille, codeInsee, meteo, listeDirecteursAdministrationCentrale, listeDirecteursProjet }: { id: string, nom: string, tauxAvancement: number | null, maille: string, codeInsee: string, meteo: Meteo, listeDirecteursAdministrationCentrale: string[], listeDirecteursProjet: string[]  }) {
    this._id = id;
    this._nom = nom;
    this._tauxAvancement = tauxAvancement;
    this._maille = maille;
    this._codeInsee = codeInsee;
    this._meteo = meteo;
    this._listeDirecteursAdministrationCentrale = listeDirecteursAdministrationCentrale;
    this._listeDirecteursProjet = listeDirecteursProjet;
  }

  get id(): string {
    return this._id;
  }

  get nom(): string {
    return this._nom;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get maille(): string {
    return this._maille;
  }

  get codeInsee(): string {
    return this._codeInsee;
  }

  get meteo(): string {
    return this._meteo;
  }

  get listeDirecteursAdministrationCentrale(): string[] {
    return this._listeDirecteursAdministrationCentrale;
  }

  get listeDirecteursProjet(): string[] {
    return this._listeDirecteursProjet;
  }

  static creerChantier({ id, nom, tauxAvancement, maille, codeInsee, meteo, listeDirecteursAdministrationCentrale, listeDirecteursProjet }: { id: string, nom: string, tauxAvancement: number | null, maille: string, codeInsee: string, meteo: Meteo, listeDirecteursAdministrationCentrale: string[], listeDirecteursProjet: string[]  }) {
    return new Chantier({ id, nom, tauxAvancement, maille, codeInsee, meteo, listeDirecteursAdministrationCentrale, listeDirecteursProjet });
  }
}
