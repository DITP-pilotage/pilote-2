export class IndicateurFicheTerritoriale {
  private readonly _nom: string;

  private readonly _valeurAvancement: number | null;

  private readonly _valeurCible: number | null;

  private readonly _tauxAvancement: number | null;

  private readonly _tauxAvancementNational: number | null;

  private readonly _uniteMesure: string | null;

  private constructor({ nom, valeurAvancement, valeurCible, tauxAvancement, tauxAvancementNational, uniteMesure }: {
    nom: string,
    valeurAvancement: number | null,
    valeurCible: number | null,
    tauxAvancement: number | null,
    tauxAvancementNational: number | null,
    uniteMesure: string | null
  }) {
    this._nom = nom;
    this._valeurAvancement = valeurAvancement;
    this._valeurCible = valeurCible;
    this._tauxAvancement = tauxAvancement;
    this._tauxAvancementNational = tauxAvancementNational;
    this._uniteMesure = uniteMesure;
  }

  get nom(): string {
    return this._nom;
  }

  get valeurAvancement(): number | null {
    return this._valeurAvancement;
  }

  get valeurCible(): number | null {
    return this._valeurCible;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get tauxAvancementNational(): number | null {
    return this._tauxAvancementNational;
  }

  get uniteMesure(): string | null {
    return this._uniteMesure;
  }

  static creerIndicateurFicheTerritoriale({
    nom,
    valeurAvancement,
    valeurCible,
    tauxAvancement,
    tauxAvancementNational,
    uniteMesure,
  }: {
    nom: string,
    valeurAvancement: number | null,
    valeurCible: number | null,
    tauxAvancement: number | null,
    tauxAvancementNational: number | null,
    uniteMesure: string | null
  }) {
    return new IndicateurFicheTerritoriale({
      nom,
      valeurAvancement,
      valeurCible,
      tauxAvancement,
      tauxAvancementNational,
      uniteMesure,
    });
  }
}
