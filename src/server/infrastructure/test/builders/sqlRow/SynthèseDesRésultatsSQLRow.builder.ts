import { faker } from "@faker-js/faker/locale/fr";
import { synthese_des_resultats } from "@prisma/client";
import {
  générerUneMailleAléatoire,
  générerUnIdentifiantUnique,
  retourneUneListeDeCodeInseeCohérentePourUneMaille,
} from "@/server/infrastructure/test/builders/utils";
import MétéoBuilder from "@/server/domain/météo/Météo.builder";

export default class SyntheseDesResultatsRowBuilder {
  private _id: synthese_des_resultats["id"];

  private _chantierId: synthese_des_resultats["chantier_id"];

  private _maille: synthese_des_resultats["maille"];

  private _codeInsee: synthese_des_resultats["code_insee"];

  private _commentaire: synthese_des_resultats["commentaire"];

  private _dateCommentaire: synthese_des_resultats["date_commentaire"];

  private _météo: synthese_des_resultats["meteo"];

  private _dateMétéo: synthese_des_resultats["date_meteo"];

  private _auteur_id: synthese_des_resultats["auteur_id"];

  constructor(possèdeCommentaireEtMétéo = Math.random() < 0.95) {
    const maille = générerUneMailleAléatoire();
    const codesInsee =
      retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);

    this._id = générerUnIdentifiantUnique("SYN");
    this._chantierId = générerUnIdentifiantUnique("CH");
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._commentaire = possèdeCommentaireEtMétéo
      ? faker.lorem.paragraphs()
      : null;
    this._dateCommentaire = possèdeCommentaireEtMétéo
      ? faker.date.recent(60, "2023-05-01T00:00:00.000Z")
      : null;
    this._météo = possèdeCommentaireEtMétéo ? new MétéoBuilder().build() : null;
    this._dateMétéo = possèdeCommentaireEtMétéo
      ? faker.date.recent(60, "2023-05-01T00:00:00.000Z")
      : null;
    this._auteur_id = null;
  }

  avecId(id: synthese_des_resultats["id"]): SyntheseDesResultatsRowBuilder {
    this._id = id;
    return this;
  }

  avecChantierId(
    chantierId: synthese_des_resultats["chantier_id"],
  ): SyntheseDesResultatsRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecMaille(
    maille: synthese_des_resultats["maille"],
  ): SyntheseDesResultatsRowBuilder {
    const codesInsee =
      retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);

    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecCodeInsee(
    codeInsee: synthese_des_resultats["code_insee"],
  ): SyntheseDesResultatsRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecCommentaire(
    commentaire: synthese_des_resultats["commentaire"],
  ): SyntheseDesResultatsRowBuilder {
    this._commentaire = commentaire;
    return this;
  }

  avecDateCommentaire(
    dateCommentaire: synthese_des_resultats["date_commentaire"],
  ): SyntheseDesResultatsRowBuilder {
    this._dateCommentaire = dateCommentaire;
    return this;
  }

  avecMétéo(
    météo: synthese_des_resultats["meteo"],
  ): SyntheseDesResultatsRowBuilder {
    this._météo = météo;
    return this;
  }

  avecAuteurId(
    auteur_id: synthese_des_resultats["auteur_id"],
  ): SyntheseDesResultatsRowBuilder {
    this._auteur_id = auteur_id;
    return this;
  }

  build(): synthese_des_resultats {
    return {
      id: this._id,
      chantier_id: this._chantierId,
      maille: this._maille,
      code_insee: this._codeInsee,
      territoire_code: this._maille + "-" + this._codeInsee,
      meteo: this._météo,
      date_meteo: this._dateMétéo,
      commentaire: this._commentaire,
      date_commentaire: this._dateCommentaire,
      auteur_id: this._auteur_id,
    };
  }
}
