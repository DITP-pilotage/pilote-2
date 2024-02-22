export class IndicateurFicheTerritoriale {
  private readonly _nom: string;

  private readonly _valeurActuelle: number | null;

  private readonly _valeurCible: number | null;

  private readonly _tauxAvancement: number | null;

  private readonly _tauxAvancementNational: number | null;

  private readonly _uniteMesure: string | null;

  private constructor({ nom, valeurActuelle, valeurCible, tauxAvancement, tauxAvancementNational, uniteMesure }: {
    nom: string,
    valeurActuelle: number | null,
    valeurCible: number | null,
    tauxAvancement: number | null,
    tauxAvancementNational: number | null,
    uniteMesure: string | null
  }) {
    this._nom = nom;
    this._valeurActuelle = valeurActuelle;
    this._valeurCible = valeurCible;
    this._tauxAvancement = tauxAvancement;
    this._tauxAvancementNational = tauxAvancementNational;
    this._uniteMesure = uniteMesure;
  }

  get nom(): string {
    return this._nom;
  }

  get valeurActuelle(): number | null {
    return this._valeurActuelle;
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
    valeurActuelle,
    valeurCible,
    tauxAvancement,
    tauxAvancementNational,
    uniteMesure,
  }: {
    nom: string,
    valeurActuelle: number | null,
    valeurCible: number | null,
    tauxAvancement: number | null,
    tauxAvancementNational: number | null,
    uniteMesure: string | null
  }) {
    return new IndicateurFicheTerritoriale({
      nom,
      valeurActuelle,
      valeurCible,
      tauxAvancement,
      tauxAvancementNational,
      uniteMesure,
    });
  }
}
