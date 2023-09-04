import { objectif_projet_structurant as ObjectifProjetStructurantPrisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ProjetStructurantBuilder from '@/server/domain/projetStructurant/ProjetStructurant.builder';

export default class ObjectifProjetStructurantSQLRowBuilder {
  private _id: ObjectifProjetStructurantPrisma['id'] = '';

  private _auteur: ObjectifProjetStructurantPrisma['auteur'] = '';

  private _type: ObjectifProjetStructurantPrisma['type'];

  private _contenu: ObjectifProjetStructurantPrisma['contenu'] = '';

  private _date: ObjectifProjetStructurantPrisma['date'] = new Date();

  private _projetStructurantId: ObjectifProjetStructurantPrisma['projet_structurant_id'] = '';

  constructor() {
    const projetStructurantGénéré = new ProjetStructurantBuilder().build();

    this._id = faker.datatype.uuid();
    this._auteur = faker.name.fullName();
    this._type = 'suivi_des_objectifs';
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(60, '2023-05-01T00:00:00.000Z');
    this._projetStructurantId = projetStructurantGénéré.id; 
  }


  avecId(id: ObjectifProjetStructurantPrisma['id']): ObjectifProjetStructurantSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecAuteur(auteur: ObjectifProjetStructurantPrisma['auteur']): ObjectifProjetStructurantSQLRowBuilder {
    this._auteur = auteur;
    return this;
  }

  avecContenu(contenu: ObjectifProjetStructurantPrisma['contenu']): ObjectifProjetStructurantSQLRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: ObjectifProjetStructurantPrisma['date']): ObjectifProjetStructurantSQLRowBuilder {
    this._date = date;
    return this;
  }

  avecProjetStructurantId(projetStructurantId: ObjectifProjetStructurantPrisma['projet_structurant_id']): ObjectifProjetStructurantSQLRowBuilder {
    this._projetStructurantId = projetStructurantId;
    return this;
  }

  shallowCopy(): ObjectifProjetStructurantSQLRowBuilder {
    const result = new ObjectifProjetStructurantSQLRowBuilder() as any;
    for (const attribut in this) {
      if (attribut == '_id') {
        continue;
      }
      result[attribut] = this[attribut];
    }
    return result as ObjectifProjetStructurantSQLRowBuilder;
  }

  build(): ObjectifProjetStructurantPrisma {
    return {
      id: this._id,
      auteur: this._auteur,
      type: this._type,
      contenu: this._contenu,
      date: this._date,
      projet_structurant_id: this._projetStructurantId,
    };
  }
}
