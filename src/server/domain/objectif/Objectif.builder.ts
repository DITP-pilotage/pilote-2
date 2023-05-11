import { faker } from '@faker-js/faker/locale/fr';
import Objectif, { typesObjectif }  from '@/server/domain/objectif/Objectif.interface';

export default class ObjectifBuilder {
  private _objectif: Objectif;

  constructor() {
    this._objectif = faker.helpers.arrayElement([this._générerUnObjectif(), null]);
  }

  private _générerUnObjectif() {
    return {
      id: faker.datatype.uuid(),
      type: faker.helpers.arrayElement(typesObjectif),
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(10, '2022-06-01T00:00:00.000Z').toISOString(),
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
