import { faker } from '@faker-js/faker';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { générerUnIdentifiantUnique } from '@/server/infrastructure/test/builders/utils';

export default class PérimètreMinistérielBuilder {
  private _id: PérimètreMinistériel['id'];

  private _nom: PérimètreMinistériel['nom'];

  constructor() {
    this._id = générerUnIdentifiantUnique('PM');
    this._nom = `${this._id} ${faker.lorem.words()}`;
  }

  avecId(id: typeof this._id): PérimètreMinistérielBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): PérimètreMinistérielBuilder {
    this._nom = nom;
    return this;
  }

  build(): PérimètreMinistériel {
    return {
      id: this._id,
      nom: this._nom,
    };
  }
}
