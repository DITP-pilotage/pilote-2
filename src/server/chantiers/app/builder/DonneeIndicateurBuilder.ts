import { DonneeIndicateur } from "@/server/chantiers/domain/DonneeIndicateur";

export class DonneeIndicateurBuilder {
  private indicId: string = "IND-001";

  private zoneId: string = "D75";

  private maille: string = "REG";

  private codeInsee: string = "01";

  private territoireCode: string = "REG-01";

  private valeurInitiale: number = 10.1;

  private dateValeurInitiale: Date = new Date("2024-06-12");

  private valeurAvancement: number = 13.4;

  private dateValeurAvancement: Date = new Date("2024-06-20");

  private valeurCible: number = 20.4;

  private dateValeurCible: Date = new Date("2024-07-12");

  private tauxAvancement: number = 15.3;

  private estBarometre: boolean = true;

  withIndicId(indicId: string): DonneeIndicateurBuilder {
    this.indicId = indicId;
    return this;
  }

  withZoneId(zoneId: string): DonneeIndicateurBuilder {
    this.zoneId = zoneId;
    return this;
  }

  withMaille(maille: string): DonneeIndicateurBuilder {
    this.maille = maille;
    return this;
  }

  withCodeInsee(codeInsee: string): DonneeIndicateurBuilder {
    this.codeInsee = codeInsee;
    return this;
  }

  withTerritoireCode(maille: string): DonneeIndicateurBuilder {
    this.maille = maille;
    return this;
  }

  withValeurInitiale(valeurInitiale: number): DonneeIndicateurBuilder {
    this.valeurInitiale = valeurInitiale;
    return this;
  }

  withDateValeurInitiale(dateValeurInitiale: Date): DonneeIndicateurBuilder {
    this.dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  withValeurAvancement(valeurAvancement: number): DonneeIndicateurBuilder {
    this.valeurAvancement = valeurAvancement;
    return this;
  }

  withDateValeurAvancement(
    dateValeurAvancement: Date,
  ): DonneeIndicateurBuilder {
    this.dateValeurAvancement = dateValeurAvancement;
    return this;
  }

  withValeurCible(valeurCible: number): DonneeIndicateurBuilder {
    this.valeurCible = valeurCible;
    return this;
  }

  withDateValeurCible(dateValeurCible: Date): DonneeIndicateurBuilder {
    this.dateValeurCible = dateValeurCible;
    return this;
  }

  withTauxAvancement(tauxAvancement: number): DonneeIndicateurBuilder {
    this.tauxAvancement = tauxAvancement;
    return this;
  }

  withEstBarometre(estBarometre: boolean): DonneeIndicateurBuilder {
    this.estBarometre = estBarometre;
    return this;
  }

  build(): DonneeIndicateur {
    return DonneeIndicateur.creerDonneeIndicateur({
      indicId: this.indicId,
      zoneId: this.zoneId,
      maille: this.maille,
      codeInsee: this.codeInsee,
      territoireCode: this.territoireCode,
      valeurInitiale: this.valeurInitiale,
      dateValeurInitiale: this.dateValeurInitiale,
      valeurAvancement: this.valeurAvancement,
      dateValeurAvancement: this.dateValeurAvancement,
      valeurCible: this.valeurCible,
      dateValeurCible: this.dateValeurCible,
      tauxAvancement: this.tauxAvancement,
      estBarometre: this.estBarometre,
    });
  }
}
