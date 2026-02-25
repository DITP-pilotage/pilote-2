import { Indicateur } from "@/server/fiche-conducteur/domain/Indicateur";

export class IndicateurBuilder {
  private nom: string = "Un nom";

  private type: string | null = "IMPACT";

  private valeurInitiale: number = 12.2;

  private dateValeurInitiale: string = "2021-01-01T00:00:00.000Z";

  private valeurAvancement: number = 14.5;

  private dateValeurAvancement: string = "2022-01-01T00:00:00.000Z";

  private valeurCible: number = 17.3;

  private tauxAvancement: number = 28.3;

  withNom(nom: string): IndicateurBuilder {
    this.nom = nom;
    return this;
  }

  withType(type: string | null): IndicateurBuilder {
    this.type = type;
    return this;
  }

  withValeurInitiale(valeurInitiale: number): IndicateurBuilder {
    this.valeurInitiale = valeurInitiale;
    return this;
  }

  withDateValeurInitiale(dateValeurInitiale: string): IndicateurBuilder {
    this.dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  withValeurAvancement(valeurAvancement: number): IndicateurBuilder {
    this.valeurAvancement = valeurAvancement;
    return this;
  }

  withDateValeurAvancement(dateValeurAvancement: string): IndicateurBuilder {
    this.dateValeurAvancement = dateValeurAvancement;
    return this;
  }

  withValeurCible(valeurCible: number): IndicateurBuilder {
    this.valeurCible = valeurCible;
    return this;
  }

  withTauxAvancement(tauxAvancement: number): IndicateurBuilder {
    this.tauxAvancement = tauxAvancement;
    return this;
  }

  build(): Indicateur {
    return Indicateur.creerIndicateur({
      nom: this.nom,
      type: this.type,
      valeurInitiale: this.valeurInitiale,
      dateValeurInitiale: this.dateValeurInitiale,
      valeurAvancement: this.valeurAvancement,
      dateValeurAvancement: this.dateValeurAvancement,
      valeurCible: this.valeurCible,
      tauxAvancement: this.tauxAvancement,
    });
  }
}
