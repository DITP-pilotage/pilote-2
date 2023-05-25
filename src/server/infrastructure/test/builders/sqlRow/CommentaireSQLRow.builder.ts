import { commentaire } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import { retourneUneListeDeCodeInseeCohérentePourUneMaille } from '@/server/infrastructure/test/builders/utils';
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { CODES_TYPES_COMMENTAIRES } from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';

export default class CommentaireRowBuilder {
  private _id: commentaire['id'];

  private _chantierId: commentaire['chantier_id'];

  private _type: commentaire['type'];

  private _contenu: commentaire['contenu'];

  private _date: commentaire['date'];

  private _auteur: commentaire['auteur'];

  private _maille: commentaire['maille'] = '';

  private _codeInsee: commentaire['code_insee'] = '';

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();
    
    this._id = faker.datatype.uuid();
    this._chantierId = chantierGénéré.id;
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(60, '2023-05-01T00:00:00.000Z');
    this._auteur = faker.name.fullName();
    this._type = faker.helpers.arrayElement([
      'actions_a_valoriser',
      'actions_a_venir',
      'autres_resultats_obtenus',
      'autres_resultats_obtenus_non_correles_aux_indicateurs',
      'commentaires_sur_les_donnees',
      'freins_a_lever',
    ]);
   
    if (this._type === 'freins_a_lever' || this._type === 'actions_a_venir' || this._type === 'actions_a_valoriser' || this._type === 'autres_resultats_obtenus_non_correles_aux_indicateurs') {
      this._maille = 'NAT';
      this._codeInsee = 'FR';
    } else if (this._type === 'commentaires_sur_les_donnees' || this._type === 'autres_resultats_obtenus') {
      this._maille = faker.helpers.arrayElement(['DEPT', 'REG']);
      this._codeInsee = faker.helpers.arrayElement(retourneUneListeDeCodeInseeCohérentePourUneMaille(this._maille));
    } else {
      this._maille = faker.helpers.arrayElement(['DEPT', 'REG', 'NAT']);
      this._codeInsee = faker.helpers.arrayElement(retourneUneListeDeCodeInseeCohérentePourUneMaille(this._maille));
    }
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
    this._type = maille === 'NAT'
      ? CODES_TYPES_COMMENTAIRES[faker.helpers.arrayElement(typesCommentaireMailleNationale)]
      : CODES_TYPES_COMMENTAIRES[faker.helpers.arrayElement(typesCommentaireMailleRégionaleOuDépartementale)];
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecCodeInsee(codeInsee: commentaire['code_insee']): CommentaireRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  shallowCopy(): CommentaireRowBuilder {
    const result = new CommentaireRowBuilder() as any;
    for (const attribut in this) {
      if (attribut == '_id') {
        continue;
      }
      result[attribut] = this[attribut];
    }
    return result as CommentaireRowBuilder;
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
