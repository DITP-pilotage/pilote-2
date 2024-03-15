import { DecisionStrategique } from '@/server/fiche-conducteur/domain/DecisionStrategique';
import { DecisionStrategiqueType } from '@/server/fiche-conducteur/domain/DecisionStrategiqueType';

export class DecisionStrategiqueBuilder {
  private type: DecisionStrategiqueType = 'suivi_des_decisions';

  private contenu: string = 'un contenu pour une decision strategique';

  private date: string = '2022-05-01T00:00:00.000Z';

  withType(type: DecisionStrategiqueType): DecisionStrategiqueBuilder {
    this.type = type;
    return this;
  }

  withContenu(contenu: string): DecisionStrategiqueBuilder {
    this.contenu = contenu;
    return this;
  }

  withDate(date: string) {
    this.date = date;
    return this;

  }

  build(): DecisionStrategique {
    return DecisionStrategique.creerDecisionStrategique({
      date: this.date,
      type: this.type,
      contenu: this.contenu,
    });
  }
}
