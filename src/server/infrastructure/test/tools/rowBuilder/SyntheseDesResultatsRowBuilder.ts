import { synthese_des_resultats } from '@prisma/client';

export default class SyntheseDesResultatsRowBuilder {
  private _commentaire: string = 'Mon commentaire';

  private _date_commentaire: string = '2023-01-01';

  withCommentaire(commentaire: string): SyntheseDesResultatsRowBuilder {
    this._commentaire = commentaire;
    return this;
  }

  withDateCommentaire(date_commentaire: string): SyntheseDesResultatsRowBuilder {
    this._date_commentaire = date_commentaire;
    return this;
  }

  build(): synthese_des_resultats {
    return {
      id: 0,
      chantier_id: '',
      maille: '',
      code_insee: '',
      date_meteo: null,
      meteo: null,
      commentaire: this._commentaire,
      date_commentaire: this._date_commentaire !== null ? new Date(this._date_commentaire) : null,
    };
  }
}
