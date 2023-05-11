import { decision_strategique } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';

export default class DécisionStratégiqueSQLRowBuilder {
  private _id: decision_strategique['id'];

  private _auteur: decision_strategique['auteur'];

  private _contenu: decision_strategique['contenu'];

  private _date: decision_strategique['date'];

  private _type: decision_strategique['type'];

  private _chantierId: decision_strategique['chantier_id'];

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();

    this._id = faker.datatype.uuid();
    this._auteur = faker.name.fullName();
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(60, '2023-05-01T00:00:00.000Z');
    this._type = 'suivi_des_decisions';
    this._chantierId = chantierGénéré.id;
  }

  avecId(id: decision_strategique['id']): DécisionStratégiqueSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecAuteur(auteur: decision_strategique['auteur']): DécisionStratégiqueSQLRowBuilder {
    this._auteur = auteur;
    return this;
  }

  avecContenu(contenu: decision_strategique['contenu']): DécisionStratégiqueSQLRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: decision_strategique['date']): DécisionStratégiqueSQLRowBuilder {
    this._date = date;
    return this;
  }

  avecChantierId(chantierId: decision_strategique['chantier_id']): DécisionStratégiqueSQLRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  build(): decision_strategique {
    return {
      id: this._id,
      auteur: this._auteur,
      contenu: this._contenu,
      date: this._date,
      type: this._type,
      chantier_id: this._chantierId,
    };
  }
}
