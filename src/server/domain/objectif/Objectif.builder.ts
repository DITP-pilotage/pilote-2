import { faker } from '@faker-js/faker/locale/fr';
import Objectif  from '@/server/domain/objectif/Objectif.interface';

export default class ObjectifBuilder {
  private _objectif: Objectif;

  constructor() {
    this._objectif = faker.helpers.arrayElement([null, this._générerUnObjectif()]);
  }

  private _générerUnObjectif() {
    return {
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(10, '2023-02-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
    };
  }

  avecObjectif(objectif: Objectif): ObjectifBuilder {
    this._objectif = objectif;
    return this;
  }

  build(): Objectif {
    return this._objectif;
  }
}
