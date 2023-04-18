import { commentaire, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import { générerUneMailleAléatoire, retourneUneListeDeCodeInseeCohérentePourUneMaille } from '@/server/infrastructure/test/builders/utils';

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
    
    const maille = générerUneMailleAléatoire();
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);

    this._id = faker.datatype.uuid();
    this._chantierId = chantierGénéré.id;
    this._type = faker.helpers.arrayElement(['freins_a_lever', 'actions_a_venir', 'actions_a_valoriser', 'autres_resultats_obtenus', 'commentaires_sur_les_donnees']);
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(10, '2023-02-01T00:00:00.000Z');
    this._auteur = faker.name.fullName();
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee); 
  }

  avecId(id: commentaire['id']): CommentaireRowBuilder {
    this._id = id;
    return this;
  }

  avecChantierId(chantierId: commentaire['chantier_id']): CommentaireRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecType(type: commentaire['type']): CommentaireRowBuilder {
    this._type = type;
    return this;
  }

  avecContenu(contenu: commentaire['contenu']): CommentaireRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: commentaire['date']): CommentaireRowBuilder {
    this._date = date;
    return this;
  }

  avecAuteur(auteur: commentaire['auteur']): CommentaireRowBuilder {
    this._auteur = auteur;
    return this;
  }

  avecMaille(maille: commentaire['maille']): CommentaireRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecCodeInsee(codeInsee: commentaire['code_insee']): CommentaireRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  build(): Prisma.commentaireCreateArgs['data'] {
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
