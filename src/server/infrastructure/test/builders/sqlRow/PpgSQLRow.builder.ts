import { ppg } from '@prisma/client';
import PpgBuilder from '@/server/domain/ppg/Ppg.builder';

export default class PpgRowBuilder {
  private _id: ppg['id'];

  private _nom: ppg['nom'];

  constructor() {
    const ppgGénérée = new PpgBuilder().build();
    
    this._id = ppgGénérée.id;
    this._nom = ppgGénérée.nom;
  }

  avecId(id: typeof this._id): PpgRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): PpgRowBuilder {
    this._nom = nom;
    return this;
  }

  build(): ppg {
    return {
      id: this._id,
      nom: this._nom,
    };
  }
}
