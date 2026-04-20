import { Indicateur } from "@/server/fiche-territoriale/domain/Indicateur";

export class IndicateurBuilder {
  private id: string = "IND-001";

  private dateValeurAvancement: string = "2019-02-02T00:00:00.000Z";

  private nom: string = "Un nom indicateur";

  private valeurAvancement: number = 12.3;

  private valeurCible: number = 31.3;

  private uniteMesure: string = "Pourcentage";

  private tauxAvancement: number | null = 10.3;

  withId(id: string): IndicateurBuilder {
    this.id = id;
    return this;
  }

  withNom(nom: string): IndicateurBuilder {
    this.nom = nom;
    return this;
  }

  withDateValeurAvancement(dateValeurAvancement: string): IndicateurBuilder {
    this.dateValeurAvancement = dateValeurAvancement;
    return this;
  }

  withTauxAvancement(tauxAvancement: number | null): IndicateurBuilder {
    this.tauxAvancement = tauxAvancement;
    return this;
  }

  withValeurAvancement(valeurAvancement: number): IndicateurBuilder {
    this.valeurAvancement = valeurAvancement;
    return this;
  }

  withValeurCible(valeurCible: number): IndicateurBuilder {
    this.valeurCible = valeurCible;
    return this;
  }

  withUniteMesure(uniteMesure: string): IndicateurBuilder {
    this.uniteMesure = uniteMesure;
    return this;
  }

  build(): Indicateur {
    return Indicateur.creerIndicateur({
      id: this.id,
      nom: this.nom,
      dateValeurAvancement: this.dateValeurAvancement,
      tauxAvancement: this.tauxAvancement,
      valeurAvancement: this.valeurAvancement,
      valeurCible: this.valeurCible,
      uniteMesure: this.uniteMesure,
    });
  }
}
