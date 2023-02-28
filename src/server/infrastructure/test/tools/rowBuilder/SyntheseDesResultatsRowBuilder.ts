import { synthese_des_resultats } from '@prisma/client';

export default class SyntheseDesResultatsRowBuilder {
  private _id: string = '0';

  private _chantier_id: string = 'CH-001';

  private _maille: string = 'NAT';

  private _code_insee: string = 'FR';

  private _commentaire: string | null = 'Mon commentaire';

  private _date_commentaire: string | null = '2023-01-01';

  withChantierId(chantier_id: string): SyntheseDesResultatsRowBuilder {
    this._chantier_id = chantier_id;
    return this;
  }

  withMaille(maille: string): SyntheseDesResultatsRowBuilder {
    this._maille = maille;
    return this;
  }

  withCodeInsee(code_insee: string): SyntheseDesResultatsRowBuilder {
    this._code_insee = code_insee;
    return this;
  }

  withCommentaire(commentaire: string | null): SyntheseDesResultatsRowBuilder {
    this._commentaire = commentaire;
    return this;
  }

  withDateCommentaire(date_commentaire: string | null): SyntheseDesResultatsRowBuilder {
    this._date_commentaire = date_commentaire;
    return this;
  }

  build(): synthese_des_resultats {
    this._id += 1;
    return {
      id: this._id,
      chantier_id: this._chantier_id,
      maille: this._maille,
      code_insee: this._code_insee,
      date_meteo: null,
      meteo: null,
      commentaire: this._commentaire,
      date_commentaire: this._date_commentaire !== null ? new Date(this._date_commentaire) : null,
    };
  }
}
