import { faker } from '@faker-js/faker/locale/fr';
import Avancement from '@/server/domain/avancement/Avancement.interface';

export default class AvancementBuilder {
  private _global: Avancement['global'];

  private _annuel: Avancement['annuel'];

  constructor() {
    this._global = faker.helpers.arrayElement([null, faker.datatype.number({ min: 0, max: 100, precision: 0.01 })]);
    this._annuel = faker.helpers.arrayElement([null, faker.datatype.number({ min: 0, max: 100, precision: 0.01 })]);
  }

  avecGlobal(global: typeof this._global): AvancementBuilder {
    this._global = global;
    return this;
  }

  avecAnnuel(annuel: typeof this._annuel): AvancementBuilder {
    this._annuel = annuel;
    return this;
  }

  build(): Avancement {
    return {
      global: this._global,
      annuel: this._annuel,
    };
  }
}
