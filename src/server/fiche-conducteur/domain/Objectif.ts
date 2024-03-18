import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';

export class Objectif {
  private readonly _type: ObjectifType;

  private readonly _contenu: string;

  private readonly _date: string;

  private constructor({ type, contenu, date }: { type: ObjectifType, contenu: string, date: string }) {
    this._type = type;
    this._contenu = contenu;
    this._date = date;
  }

  get type(): ObjectifType {
    return this._type;
  }

  get contenu(): string {
    return this._contenu;
  }

  get date(): string {
    return this._date;
  }

  static creerObjectif({ type, contenu, date }: { type: ObjectifType, contenu: string, date: string }) {
    return new Objectif({ type, contenu, date });
  }
}
