import { faker } from '@faker-js/faker/locale/fr';
import Objectif, { typesObjectifChantier }  from '@/server/domain/objectif/Objectif.interface';

export default class ObjectifBuilder {
  private _objectif: Objectif;

  constructor() {
    this._objectif = faker.helpers.arrayElement([this._générerUnObjectif(), null]);
  }

  private _générerUnObjectif() {
    return {
      id: faker.datatype.uuid(),
      type: faker.helpers.arrayElement(typesObjectifChantier),
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
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
