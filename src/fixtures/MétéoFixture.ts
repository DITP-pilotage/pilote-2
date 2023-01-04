import { faker } from '@faker-js/faker';
import Météo from '@/server/domain/chantier/Météo.interface';

class MétéoFixture {
  générer(): Météo {
    return faker.helpers.arrayElement([null, 1, 2, 3, 4] as Météo[]);
  }
}

export default new MétéoFixture();
