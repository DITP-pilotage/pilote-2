export class SyntheseDesResultats {
  private readonly _dateMeteo: string;

  private readonly _dateCommentaire: string;

  private constructor({ dateMeteo, dateCommentaire }: { dateCommentaire: string; dateMeteo: string }) {
    this._dateMeteo = dateMeteo;
    this._dateCommentaire = dateCommentaire;
  }

  get dateMeteo(): string {
    return this._dateMeteo;
  }

  get dateCommentaire(): string {
    return this._dateCommentaire;
  }

  static creerSyntheseDesResultats({ dateMeteo, dateCommentaire }: { dateCommentaire: string; dateMeteo: string }) {
    return new SyntheseDesResultats({ dateMeteo, dateCommentaire });
  }
}
