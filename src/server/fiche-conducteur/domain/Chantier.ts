import { Meteo } from '@/server/fiche-conducteur/domain/Meteo';

export class Chantier {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _estTerritorialise: boolean;

  private readonly _tauxAvancement: number | null;

  private readonly _tauxAvancementAnnuel: number | null;

  private readonly _maille: string;

  private readonly _codeInsee: string;

  private readonly _meteo: string;

  private readonly _estApplicable: boolean;

  private readonly _listeDirecteursAdministrationCentrale: string[];

  private readonly _listeDirecteursProjet: string[];

  private constructor({ id, nom, estTerritorialise, tauxAvancement, tauxAvancementAnnuel, maille, codeInsee, meteo, estApplicable, listeDirecteursAdministrationCentrale, listeDirecteursProjet }: { id: string, nom: string, estTerritorialise: boolean, tauxAvancement: number | null, tauxAvancementAnnuel: number | null, maille: string, codeInsee: string, meteo: Meteo, estApplicable: boolean, listeDirecteursAdministrationCentrale: string[], listeDirecteursProjet: string[]  }) {
    this._id = id;
    this._nom = nom;
    this._estTerritorialise = estTerritorialise;
    this._tauxAvancement = tauxAvancement;
    this._tauxAvancementAnnuel = tauxAvancementAnnuel;
    this._maille = maille;
    this._codeInsee = codeInsee;
    this._meteo = meteo;
    this._estApplicable = estApplicable;
    this._listeDirecteursAdministrationCentrale = listeDirecteursAdministrationCentrale;
    this._listeDirecteursProjet = listeDirecteursProjet;
  }

  get id(): string {
    return this._id;
  }

  get nom(): string {
    return this._nom;
  }

  get estTerritorialise(): boolean {
    return this._estTerritorialise;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get tauxAvancementAnnuel(): number | null {
    return this._tauxAvancementAnnuel;
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

  get estApplicable(): boolean {
    return this._estApplicable;
  }

  get listeDirecteursAdministrationCentrale(): string[] {
    return this._listeDirecteursAdministrationCentrale;
  }

  get listeDirecteursProjet(): string[] {
    return this._listeDirecteursProjet;
  }

  static creerChantier({ id, nom, estTerritorialise, tauxAvancement, tauxAvancementAnnuel, maille, codeInsee, meteo, estApplicable, listeDirecteursAdministrationCentrale, listeDirecteursProjet }: { id: string, nom: string, estTerritorialise: boolean, tauxAvancement: number | null, tauxAvancementAnnuel: number | null, maille: string, codeInsee: string, meteo: Meteo, estApplicable: boolean, listeDirecteursAdministrationCentrale: string[], listeDirecteursProjet: string[]  }) {
    return new Chantier({ id, nom, estTerritorialise, tauxAvancement, tauxAvancementAnnuel, maille, codeInsee, meteo, estApplicable, listeDirecteursAdministrationCentrale, listeDirecteursProjet });
  }
}
