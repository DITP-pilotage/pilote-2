import { objectif, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';

export default class ObjectifSQLRowBuilder {
  private _id: objectif['id'];

  private _auteur: objectif['auteur'];

  private _type: objectif['type'];

  private _contenu: objectif['contenu'];

  private _date: objectif['date'];

  private _chantierId: objectif['chantier_id'];

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();

    this._id = faker.datatype.uuid();
    this._auteur = faker.name.fullName();
    this._type = faker.helpers.arrayElement(['notre_ambition', 'deja_fait', 'a_faire']);
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(10, '2023-02-01T00:00:00.000Z');
    this._chantierId = chantierGénéré.id;
  }

  avecId(id: objectif['id']): ObjectifSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecAuteur(auteur: objectif['auteur']): ObjectifSQLRowBuilder {
    this._auteur = auteur;
    return this;
  }

  avecType(type: objectif['type']): ObjectifSQLRowBuilder {
    this._type = type;
    return this;
  }

  avecContenu(contenu: objectif['contenu']): ObjectifSQLRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: objectif['date']): ObjectifSQLRowBuilder {
    this._date = date;
    return this;
  }

  avecChantierId(chantierId: objectif['chantier_id']): ObjectifSQLRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  build(): Prisma.objectifCreateArgs['data'] {
    return {
      id: this._id,
      auteur: this._auteur,
      type: this._type,
      contenu: this._contenu,
      date: this._date,
      chantier_id: this._chantierId,
    };
  }
}
