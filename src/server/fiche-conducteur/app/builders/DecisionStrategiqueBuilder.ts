import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';
import { DecisionStrategique } from '@/server/fiche-conducteur/domain/DecisionStrategique';

export class DecisionStrategiqueBuilder {
  private type: ObjectifType = 'decision_strategique';

  private contenu: string = 'un contenu pour une decision strategique';

  private date: string = '2022-05-01T00:00:00.000Z';

  withType(type: ObjectifType): DecisionStrategiqueBuilder {
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
