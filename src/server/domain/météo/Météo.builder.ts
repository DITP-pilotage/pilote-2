import { faker } from '@faker-js/faker/locale/fr';
import { Météo, météos } from '@/server/domain/météo/Météo.interface';

export default class MétéoBuilder {
  private readonly _météo: Météo;

  constructor() {
    this._météo = faker.helpers.arrayElement(météos);
  }

  build(): Météo {
    return this._météo;
  }
}
