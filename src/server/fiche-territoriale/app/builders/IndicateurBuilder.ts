import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';

export class IndicateurBuilder {
  private id: string = 'IND-001';

  private dateValeurActuelle: string = '2019-02-02T00:00:00.000Z';

  private nom: string = 'Un nom indicateur';

  private valeurActuelle: number = 12.3;

  private valeurCible: number = 31.3;

  private uniteMesure: string = 'Pourcentage';

  private objectifTauxAvancement: number | null = 10.3;

  withId(id: string): IndicateurBuilder {
    this.id = id;
    return this;
  }

  withNom(nom: string): IndicateurBuilder {
    this.nom = nom;
    return this;
  }

  withDateValeurActuelle(dateValeurActuelle: string): IndicateurBuilder {
    this.dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  withObjectifTauxAvancement(objectifTauxAvancement: number | null): IndicateurBuilder {
    this.objectifTauxAvancement = objectifTauxAvancement;
    return this;
  }

  withValeurActuelle(valeurActuelle: number): IndicateurBuilder {
    this.valeurActuelle = valeurActuelle;
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
      dateValeurActuelle: this.dateValeurActuelle,
      objectifTauxAvancement: this.objectifTauxAvancement,
      valeurActuelle: this.valeurActuelle,
      valeurCible: this.valeurCible,
      uniteMesure: this.uniteMesure,
    });
  }
}
