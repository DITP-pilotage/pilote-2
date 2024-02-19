import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';

export class IndicateurBuilder {
  private dateValeurActuelle: string = '2019-02-02T00:00:00.000Z';

  withDateValeurActuelle(dateValeurActuelle: string): IndicateurBuilder {
    this.dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  build(): Indicateur {
    return Indicateur.creerIndicateur({
      dateValeurActuelle: this.dateValeurActuelle,
    });
  }
}
