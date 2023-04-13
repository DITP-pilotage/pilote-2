import { decisions_strategiques, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';

export default class DécisionsStratégiquesSQLRowBuilder {
  private _id: decisions_strategiques['id'];

  private _auteur: decisions_strategiques['auteur'];

  private _contenu: decisions_strategiques['contenu'];

  private _date: decisions_strategiques['date'];

  private _type: decisions_strategiques['type'];

  private _chantierId: decisions_strategiques['chantier_id'];

  constructor() {
    const chantierGénéré = new ChantierBuilder().build();

    this._id = faker.datatype.uuid();
    this._auteur = faker.name.fullName();
    this._contenu = faker.lorem.paragraph();
    this._date = faker.date.recent(10, '2023-02-01T00:00:00.000Z');
    this._type = 'suivi_des_decisions';
    this._chantierId = chantierGénéré.id;
  }

  avecId(id: decisions_strategiques['id']): DécisionsStratégiquesSQLRowBuilder {
    this._id = id;
    return this;
  }

  avecAuteur(auteur: decisions_strategiques['auteur']): DécisionsStratégiquesSQLRowBuilder {
    this._auteur = auteur;
    return this;
  }

  avecContenu(contenu: decisions_strategiques['contenu']): DécisionsStratégiquesSQLRowBuilder {
    this._contenu = contenu;
    return this;
  }

  avecDate(date: decisions_strategiques['date']): DécisionsStratégiquesSQLRowBuilder {
    this._date = date;
    return this;
  }

  avecChantierId(chantierId: decisions_strategiques['chantier_id']): DécisionsStratégiquesSQLRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  build(): Prisma.decisions_strategiquesCreateArgs['data'] {
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
