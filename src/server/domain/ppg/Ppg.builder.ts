import { faker } from '@faker-js/faker';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

export default class PpgBuilder {
  private _id: Ppg['id'];

  private _nom: Ppg['nom'];

  constructor() {
    this._id = générerUnIdentifiantUnique('PPG');
    this._nom = `${this._id} ${faker.lorem.words()}`;
  }

  avecId(id: typeof this._id): PpgBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): PpgBuilder {
    this._nom = nom;
    return this;
  }

  build(): Ppg {
    return {
      id: this._id,
      nom: this._nom,
    };
  }
}
