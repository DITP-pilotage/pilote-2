import { faker } from '@faker-js/faker';
import { Territoires } from '@/server/domain/chantier/Chantier.interface';

export class TerritoiresBuilder {
  private _territoires: Territoires;

  constructor(codesInsee: string[]) {
    this._territoires = {};

    codesInsee.forEach(codeInsee => {
      this._territoires[codeInsee] = {
        codeInsee: codeInsee,
        avancement: {
          annuel: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
          global: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
        },
      };
    });
  }

  construire() {
    return this._territoires;
  }
}
