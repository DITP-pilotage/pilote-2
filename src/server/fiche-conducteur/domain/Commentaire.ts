import { CommentaireType } from '@/server/fiche-conducteur/domain/CommentaireType';

export class Commentaire {
  private readonly _type: CommentaireType;

  private readonly _contenu: string;

  private readonly _date: string;

  private constructor({ type, contenu, date }: { type: CommentaireType, contenu: string, date: string }) {
    this._type = type;
    this._contenu = contenu;
    this._date = date;
  }

  get type(): CommentaireType {
    return this._type;
  }

  get contenu(): string {
    return this._contenu;
  }

  get date(): string {
    return this._date;
  }

  static creerCommentaire({ type, contenu, date }: { type: CommentaireType, contenu: string, date: string }) {
    return new Commentaire({ type, contenu, date });
  }
}
