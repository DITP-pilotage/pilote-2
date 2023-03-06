import { commentaire } from '@prisma/client';

export default class CommentaireRowBuilder {
  private _id: string = '0';

  private _chantier_id: string = 'CH-001';

  private _maille: string = 'NAT';

  private _code_insee: string = 'FR';

  private _type: string = 'freins_a_lever';

  private _contenu: string = 'Mon commentaire';

  private _date: string = '2023-01-01';

  private _auteur: string = 'Jean Bon';

  withChantierId(chantier_id: string): CommentaireRowBuilder {
    this._chantier_id = chantier_id;
    return this;
  }

  withMaille(maille: string): CommentaireRowBuilder {
    this._maille = maille;
    return this;
  }

  withCodeInsee(code_insee: string): CommentaireRowBuilder {
    this._code_insee = code_insee;
    return this;
  }

  withType(type: string): CommentaireRowBuilder {
    this._type = type;
    return this;
  }

  withContenu(contenu: string): CommentaireRowBuilder {
    this._contenu = contenu;
    return this;
  }

  withDate(date: string): CommentaireRowBuilder {
    this._date = date;
    return this;
  }

  withAuteur(auteur: string): CommentaireRowBuilder {
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
      date: new Date(this._date),
      auteur: this._auteur,
      maille: this._maille,
      code_insee: this._code_insee,
    };
  }
}
