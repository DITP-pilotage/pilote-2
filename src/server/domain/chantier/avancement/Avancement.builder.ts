import { faker } from '@faker-js/faker/locale/fr';
import Avancement from '@/server/domain/chantier/avancement/Avancement.interface';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';

export default class AvancementBuilder {
  private _global: Avancement['global'];

  private _annuel: Avancement['annuel'];

  constructor() {
    this._global = générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 100, precision: 0.01 }));
    this._annuel = générerPeutÊtreNull(0.1, faker.datatype.number({ min: 0, max: 100, precision: 0.01 }));
  }

  build(): Avancement {
    return {
      global: this._global,
      annuel: this._annuel,
    };
  }
}
