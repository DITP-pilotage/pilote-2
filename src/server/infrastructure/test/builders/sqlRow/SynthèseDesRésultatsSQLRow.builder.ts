import { faker } from '@faker-js/faker/locale/fr';
import { synthese_des_resultats } from '@prisma/client';
import { générerUneMailleAléatoire, générerUnIdentifiantUnique, retourneUneListeDeCodeInseeCohérentePourUneMaille } from '@/server/infrastructure/test/builders/utils';

export default class SyntheseDesResultatsRowBuilder {
  private _id: synthese_des_resultats['id'];

  private _chantierId: synthese_des_resultats['chantier_id'];

  private _maille: synthese_des_resultats['maille'];

  private _codeInsee: synthese_des_resultats['code_insee'];

  private _commentaire: synthese_des_resultats['commentaire'];

  private _dateCommentaire: synthese_des_resultats['date_commentaire'];

  constructor() {
    const maille = générerUneMailleAléatoire();
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);

    this._id = générerUnIdentifiantUnique('SYN');
    this._chantierId = générerUnIdentifiantUnique('CH');
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._commentaire = faker.helpers.arrayElement([null, faker.lorem.paragraphs()]);
    this._dateCommentaire = faker.helpers.arrayElement([null, faker.date.recent(10, '2023-02-01T00:00:00.000Z')]);
  }

  avecId(id: typeof this._id): SyntheseDesResultatsRowBuilder {
    this._id = id;
    return this;
  }

  avecChantierId(chantierId: typeof this._chantierId): SyntheseDesResultatsRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecMaille(maille: typeof this._maille): SyntheseDesResultatsRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecCodeInsee(codeInsee: typeof this._codeInsee): SyntheseDesResultatsRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecCommentaire(commentaire: typeof this._commentaire): SyntheseDesResultatsRowBuilder {
    this._commentaire = commentaire;
    return this;
  }

  avecDateCommentaire(dateCommentaire: typeof this._dateCommentaire): SyntheseDesResultatsRowBuilder {
    this._dateCommentaire = dateCommentaire;
    return this;
  }

  build(): synthese_des_resultats {
    return {
      id: this._id,
      chantier_id: this._chantierId,
      maille: this._maille,
      code_insee: this._codeInsee,
      meteo: null,
      date_meteo: null,
      commentaire: this._commentaire,
      date_commentaire: this._dateCommentaire,
    };
  }
}
