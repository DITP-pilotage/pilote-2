import { faker } from '@faker-js/faker/locale/fr';
import Axe from '@/server/domain/axe/Axe.interface';
import { générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

export default class AxeBuilder {
  private _id: Axe['id'];

  private _nom: Axe['nom'];

  constructor() {
    this._id = générerUnIdentifiantUnique('AXE');
    this._nom = `${this._id} ${faker.lorem.words()}`;
  }

  avecId(id: typeof this._id): AxeBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): AxeBuilder {
    this._nom = nom;
    return this;
  }

  build(): Axe {
    return {
      id: this._id,
      nom: this._nom,
    };
  }
}
