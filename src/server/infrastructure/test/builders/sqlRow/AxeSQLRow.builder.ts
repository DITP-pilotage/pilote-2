import { axe } from '@prisma/client';
import AxeBuilder from '@/server/domain/axe/Axe.builder';

export default class AxeRowBuilder {
  private _id: axe['id'];

  private _nom: axe['nom'];

  constructor() {
    const axeGénéré = new AxeBuilder().build();
    
    this._id = axeGénéré.id;
    this._nom = axeGénéré.nom;
  }

  avecId(id: typeof this._id): AxeRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): AxeRowBuilder {
    this._nom = nom;
    return this;
  }

  build(): axe {
    return {
      id: this._id,
      nom: this._nom,
    };
  }
}
