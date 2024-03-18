import { Indicateur } from '@/server/fiche-conducteur/domain/Indicateur';

export class IndicateurBuilder {
  private nom: string = 'Un nom';

  private type: string | null = 'IMPACT';

  private valeurInitiale: number = 12.2;

  private dateValeurInitiale: string = '2021-01-01T00:00:00.000Z';

  private valeurActuelle: number = 14.5;

  private dateValeurActuelle: string = '2022-01-01T00:00:00.000Z';

  private objectifValeurCibleIntermediaire: number = 17.3;

  private objectifTauxAvancementIntermediaire: number = 28.3;

  private objectifCible: number = 12.3;

  private objectifTauxAvancement: number = 16.3;

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

  withValeurActuelle(valeurActuelle: number): IndicateurBuilder {
    this.valeurActuelle = valeurActuelle;
    return this;
  }

  withDateValeurActuelle(dateValeurActuelle: string): IndicateurBuilder {
    this.dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  withObjectifValeurCibleIntermediaire(objectifValeurCibleIntermediaire: number): IndicateurBuilder {
    this.objectifValeurCibleIntermediaire = objectifValeurCibleIntermediaire;
    return this;
  }

  withObjectifTauxAvancementIntermediaire(objectifTauxAvancementIntermediaire: number): IndicateurBuilder {
    this.objectifTauxAvancementIntermediaire = objectifTauxAvancementIntermediaire;
    return this;
  }

  withObjectifCible(objectifCible: number): IndicateurBuilder {
    this.objectifCible = objectifCible;
    return this;
  }

  withObjectifTauxAvancement(objectifTauxAvancement: number): IndicateurBuilder {
    this.objectifTauxAvancement = objectifTauxAvancement;
    return this;
  }

  build(): Indicateur {
    return Indicateur.creerIndicateur({
      nom: this.nom,
      type: this.type,
      valeurInitiale: this.valeurInitiale,
      dateValeurInitiale: this.dateValeurInitiale,
      valeurActuelle: this.valeurActuelle,
      dateValeurActuelle: this.dateValeurActuelle,
      objectifValeurCibleIntermediaire: this.objectifValeurCibleIntermediaire,
      objectifTauxAvancementIntermediaire: this.objectifTauxAvancementIntermediaire,
      objectifValeurCible: this.objectifCible,
      objectifTauxAvancement: this.objectifTauxAvancement,
    });
  }
}
