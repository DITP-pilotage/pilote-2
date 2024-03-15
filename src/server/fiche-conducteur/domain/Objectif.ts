import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';

export class Objectif {
  private readonly _type: ObjectifType;

  private readonly _contenu: string;

  private constructor({ type, contenu }: { type: ObjectifType, contenu: string }) {
    this._type = type;

    this._contenu = contenu;
  }

  get type(): ObjectifType {
    return this._type;
  }

  get contenu(): string {
    return this._contenu;
  }

  static creerObjectif({ type, contenu }: { type: ObjectifType, contenu: string }) {
    return new Objectif({ type, contenu });
  }
}
