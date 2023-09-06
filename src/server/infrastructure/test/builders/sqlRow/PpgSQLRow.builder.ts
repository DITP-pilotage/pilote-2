import { ppg } from '@prisma/client';
import PpgBuilder from '@/server/domain/ppg/Ppg.builder';

export default class PpgRowBuilder {
  private _id: ppg['id'];

  private _nom: ppg['nom'];

  private _a_supprimer: ppg['a_supprimer'];

  constructor() {
    const ppgGénérée = new PpgBuilder().build();
    
    this._id = ppgGénérée.id;
    this._nom = ppgGénérée.nom;
    this._a_supprimer = false;
  }

  avecId(id: ppg['id']): PpgRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: ppg['nom']): PpgRowBuilder {
    this._nom = nom;
    return this;
  }

  build(): ppg {
    return {
      id: this._id,
      nom: this._nom,
      a_supprimer: this._a_supprimer,
    };
  }
}
