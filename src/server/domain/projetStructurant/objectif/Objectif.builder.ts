import { faker } from '@faker-js/faker/locale/fr';
import ObjectifProjetStructurant, { typeObjectifProjetStructurant } from './Objectif.interface';

export default class ObjectifProjetStructurantBuilder {
  private _objectif: ObjectifProjetStructurant;

  constructor() {
    this._objectif = faker.helpers.arrayElement([this._générerUnObjectif(), null]);
  }

  private _générerUnObjectif() {
    return {
      id: faker.datatype.uuid(),
      type: typeObjectifProjetStructurant,
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
    };
  }

  avecObjectif(objectif: ObjectifProjetStructurant): ObjectifProjetStructurantBuilder {
    this._objectif = objectif;
    return this;
  }

  build(): ObjectifProjetStructurant {
    return this._objectif;
  }
}
