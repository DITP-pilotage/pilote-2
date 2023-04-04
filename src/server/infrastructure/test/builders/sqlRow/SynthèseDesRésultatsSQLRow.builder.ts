import { faker } from '@faker-js/faker/locale/fr';
import { synthese_des_resultats } from '@prisma/client';
import { générerUneMailleAléatoire, générerUnIdentifiantUnique, retourneUneListeDeCodeInseeCohérentePourUneMaille } from '@/server/infrastructure/test/builders/utils';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';

export default class SyntheseDesResultatsRowBuilder {
  private _id: synthese_des_resultats['id'];

  private _chantierId: synthese_des_resultats['chantier_id'];

  private _maille: synthese_des_resultats['maille'];

  private _codeInsee: synthese_des_resultats['code_insee'];

  private _commentaire: synthese_des_resultats['commentaire'];

  private _dateCommentaire: synthese_des_resultats['date_commentaire'];

  private _météo: synthese_des_resultats['meteo'];

  constructor() {
    const maille = générerUneMailleAléatoire();
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);

    this._id = générerUnIdentifiantUnique('SYN');
    this._chantierId = générerUnIdentifiantUnique('CH');
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._commentaire = faker.helpers.arrayElement([null, faker.lorem.paragraphs()]);
    this._dateCommentaire = faker.helpers.arrayElement([null, faker.date.recent(10, '2023-02-01T00:00:00.000Z')]);
    this._météo = new MétéoBuilder().build();
  }

  avecId(id: synthese_des_resultats['id']): SyntheseDesResultatsRowBuilder {
    this._id = id;
    return this;
  }

  avecChantierId(chantierId: synthese_des_resultats['chantier_id']): SyntheseDesResultatsRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecMaille(maille: synthese_des_resultats['maille']): SyntheseDesResultatsRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecCodeInsee(codeInsee: synthese_des_resultats['code_insee']): SyntheseDesResultatsRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecCommentaire(commentaire: synthese_des_resultats['commentaire']): SyntheseDesResultatsRowBuilder {
    this._commentaire = commentaire;
    return this;
  }

  avecDateCommentaire(dateCommentaire: synthese_des_resultats['date_commentaire']): SyntheseDesResultatsRowBuilder {
    this._dateCommentaire = dateCommentaire;
    return this;
  }

  avecMétéo(météo: synthese_des_resultats['meteo']): SyntheseDesResultatsRowBuilder {
    this._météo = météo;
    return this;
  }

  build(): synthese_des_resultats {
    return {
      id: this._id,
      chantier_id: this._chantierId,
      maille: this._maille,
      code_insee: this._codeInsee,
      meteo: this._météo,
      date_meteo: null,
      commentaire: this._commentaire,
      date_commentaire: this._dateCommentaire,
    };
  }
}
