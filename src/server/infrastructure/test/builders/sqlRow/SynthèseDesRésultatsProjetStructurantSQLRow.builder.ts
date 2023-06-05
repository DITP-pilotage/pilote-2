import { faker } from '@faker-js/faker/locale/fr';
import { synthese_des_resultats_projet_structurant } from '@prisma/client';
import { générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';

export default class SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
  private _id: synthese_des_resultats_projet_structurant['id'];

  private _projetStructurantId: synthese_des_resultats_projet_structurant['projet_structurant_id'];

  private _commentaire: synthese_des_resultats_projet_structurant['commentaire'];

  private _dateCommentaire: synthese_des_resultats_projet_structurant['date_commentaire'];

  private _météo: synthese_des_resultats_projet_structurant['meteo'];

  private _dateMétéo: synthese_des_resultats_projet_structurant['date_meteo'];

  private _auteur: synthese_des_resultats_projet_structurant['auteur'];

  constructor(possèdeCommentaireEtMétéo = Math.random() < 0.95) {

    this._id = générerUnIdentifiantUnique('SYN');
    this._projetStructurantId = générerUnIdentifiantUnique('PS');
    this._commentaire = possèdeCommentaireEtMétéo ? faker.lorem.paragraphs() : null;
    this._dateCommentaire = possèdeCommentaireEtMétéo ? faker.date.recent(60, '2023-05-01T00:00:00.000Z') : null;
    this._météo = possèdeCommentaireEtMétéo ? new MétéoBuilder().build() : null;
    this._dateMétéo = possèdeCommentaireEtMétéo ? faker.date.recent(60, '2023-05-01T00:00:00.000Z') : null;
    this._auteur = possèdeCommentaireEtMétéo ? faker.name.fullName() : null;
  }

  avecId(id: synthese_des_resultats_projet_structurant['id']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecProjetStructurantId(projetStructurantId: synthese_des_resultats_projet_structurant['projet_structurant_id']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._projetStructurantId = projetStructurantId;
    return this;
  }

  avecCommentaire(commentaire: synthese_des_resultats_projet_structurant['commentaire']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._commentaire = commentaire;
    return this;
  }

  avecDateCommentaire(dateCommentaire: synthese_des_resultats_projet_structurant['date_commentaire']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._dateCommentaire = dateCommentaire;
    return this;
  }

  avecMétéo(météo: synthese_des_resultats_projet_structurant['meteo']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._météo = météo;
    return this;
  }

  avecDateMétéo(dateMétéo: synthese_des_resultats_projet_structurant['date_meteo']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._dateMétéo = dateMétéo;
    return this;
  }

  avecAuteur(auteur: synthese_des_resultats_projet_structurant['auteur']): SynthèseDesRésultatsProjetStructurantSQLRowBuilder {
    this._auteur = auteur;
    return this;
  }

  build(): synthese_des_resultats_projet_structurant {
    return {
      id: this._id,
      projet_structurant_id: this._projetStructurantId,
      meteo: this._météo,
      date_meteo: this._dateMétéo,
      commentaire: this._commentaire,
      date_commentaire: this._dateCommentaire,
      auteur: this._auteur,
    };
  }
}
