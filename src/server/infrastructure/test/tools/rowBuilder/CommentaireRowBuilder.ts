import { commentaire } from '@prisma/client';

export default class CommentaireRowBuilder {
  private _id: string = '0';

  private _chantier_id: string = 'CH-001';

  private _type: string = 'freins_a_lever';

  private _contenu: string | null = 'Mon commentaire';

  private _date: string | null = '2023-01-01';

  private _auteur: string | null = 'Jean Bon';

  withChantierId(chantier_id: string): CommentaireRowBuilder {
    this._chantier_id = chantier_id;
    return this;
  }

  withType(type: string): CommentaireRowBuilder {
    this._type = type;
    return this;
  }

  withContenu(contenu: string | null): CommentaireRowBuilder {
    this._contenu = contenu;
    return this;
  }

  withDate(date: string | null): CommentaireRowBuilder {
    this._date = date;
    return this;
  }

  withAuteur(auteur: string | null): CommentaireRowBuilder {
    this._auteur = auteur;
    return this;
  }

  build(): commentaire {
    this._id += 1;
    return {
      id: this._id,
      chantier_id: this._chantier_id,
      type: this._type,
      contenu: this._contenu,
      date: this._date !== null ? new Date(this._date) : null,
      auteur: this._auteur,
    };
  }
}
