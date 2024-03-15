import { DecisionStrategiqueType } from '@/server/fiche-conducteur/domain/DecisionStrategiqueType';

export class DecisionStrategique {
  private readonly _type: DecisionStrategiqueType;

  private readonly _contenu: string;

  private readonly _date: string;

  private constructor({ type, contenu, date }: { type: DecisionStrategiqueType, contenu: string, date: string }) {
    this._type = type;
    this._contenu = contenu;
    this._date = date;
  }

  get type(): DecisionStrategiqueType {
    return this._type;
  }

  get contenu(): string {
    return this._contenu;
  }

  get date(): string {
    return this._date;
  }

  static creerDecisionStrategique({ type, contenu, date }: { type: DecisionStrategiqueType, contenu: string, date: string }) {
    return new DecisionStrategique({ type, contenu, date });
  }
}
