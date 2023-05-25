import { commentaire_projet_structurant } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ProjetStructurantBuilder from '@/server/domain/projetStructurant/ProjetStructurant.builder';

export default class CommentaireProjetStructurantRowBuilder {
  private _id: commentaire_projet_structurant['id'];

  private _projetStructurantId: commentaire_projet_structurant['projet_structurant_id'];

  private _type: commentaire_projet_structurant['type'];

  private _contenu: commentaire_projet_structurant['contenu'];

  private _date: commentaire_projet_structurant['date'];

  private _auteur: commentaire_projet_structurant['auteur'];

  constructor() {
    const projetStructurantGénéré = new ProjetStructurantBuilder().build();
    
    this._id = faker.datatype.uuid();
    this._projetStructurantId = projetStructurantGénéré.id;
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(60, '2023-05-01T00:00:00.000Z');
    this._auteur = faker.name.fullName();
    this._type = faker.helpers.arrayElement([
      'dernieres_realisation_et_suivi_des_decisions',
      'difficultes_rencontrees_et_risques_anticipes',
      'solutions_proposees_et_prochaines_etapes',
      'partenariats_et_moyens_mobilises',
    ]);
  }

  avecId(id: commentaire_projet_structurant['id']): CommentaireProjetStructurantRowBuilder {
    this._id = id;
    return this;
  }

  avecProjetStructurantId(projetStructurantId: commentaire_projet_structurant['projet_structurant_id']): CommentaireProjetStructurantRowBuilder {
    this._projetStructurantId = projetStructurantId;
    return this;
  }

  avecType(type: commentaire_projet_structurant['type']): CommentaireProjetStructurantRowBuilder {
    this._type = type;
    return this;
  }

  avecContenu(contenu: commentaire_projet_structurant['contenu']): CommentaireProjetStructurantRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: commentaire_projet_structurant['date']): CommentaireProjetStructurantRowBuilder {
    this._date = date;
    return this;
  }

  avecAuteur(auteur: commentaire_projet_structurant['auteur']): CommentaireProjetStructurantRowBuilder {
    this._auteur = auteur;
    return this;
  }

  shallowCopy(): CommentaireProjetStructurantRowBuilder {
    const result = new CommentaireProjetStructurantRowBuilder() as any;
    for (const attribut in this) {
      if (attribut == '_id') {
        continue;
      }
      result[attribut] = this[attribut];
    }
    return result as CommentaireProjetStructurantRowBuilder;
  }

  build(): commentaire_projet_structurant {
    return {
      id: this._id,
      projet_structurant_id: this._projetStructurantId,
      type: this._type,
      contenu: this._contenu,
      date: this._date,
      auteur: this._auteur,
    };
  }
}
