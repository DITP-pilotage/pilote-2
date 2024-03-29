import { faker } from '@faker-js/faker/locale/fr';
import { Météo, météos } from '@/server/domain/météo/Météo.interface';

export default class MétéoBuilder {
  private _météo: Météo;

  constructor() {
    this._météo = faker.helpers.arrayElement(météos);
  }

  avecMétéo(météo: Météo): MétéoBuilder {
    this._météo = météo;
    return this;
  }

  build(): Météo {
    return this._météo;
  }
}
