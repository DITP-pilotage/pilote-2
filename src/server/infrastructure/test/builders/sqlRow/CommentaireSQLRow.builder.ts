import { commentaire } from '@prisma/client';
import { faker } from '@faker-js/faker';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import { génèreUneMailleAléatoireEtUneListeDeCodesInseeCohérente, générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

export default class CommentaireRowBuilder {
  private _id: commentaire['id'];

  private _chantierId: commentaire['chantier_id'];

  private _type: commentaire['type'];

  private _contenu: commentaire['contenu'];

  private _date: commentaire['date'];

  private _auteur: commentaire['auteur'];

  private _maille: commentaire['maille'];

  private _codeInsee: commentaire['code_insee'];

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();
    
    const { maille, codesInsee } = génèreUneMailleAléatoireEtUneListeDeCodesInseeCohérente();

    this._id = générerUnIdentifiantUnique('COM');
    this._chantierId = chantierGénéré.id;
    this._type = faker.helpers.arrayElement(['freins_a_lever', 'actions_a_venir', 'actions_a_valoriser', 'autres_resultats_obtenus', 'objectifs']);
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(10);
    this._auteur = faker.name.fullName();
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee); 
  }

  avecId(id: typeof this._id): CommentaireRowBuilder {
    this._id = id;
    return this;
  }

  avecChantierId(chantierId: typeof this._chantierId): CommentaireRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecType(type: typeof this._type): CommentaireRowBuilder {
    this._type = type;
    return this;
  }

  avecContenu(contenu: typeof this._contenu): CommentaireRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: typeof this._date): CommentaireRowBuilder {
    this._date = date;
    return this;
  }

  avecAuteur(auteur: typeof this._auteur): CommentaireRowBuilder {
    this._auteur = auteur;
    return this;
  }

  avecMaille(maille: typeof this._maille): CommentaireRowBuilder {
    this._maille = maille;
    return this;
  }

  avecCodeInsee(codeInsee: typeof this._codeInsee): CommentaireRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  build(): commentaire {
    return {
      id: this._id,
      chantier_id: this._chantierId,
      type: this._type,
      contenu: this._contenu,
      date: this._date,
      auteur: this._auteur,
      maille: this._maille,
      code_insee: this._codeInsee,
    };
  }
}
