import { faker } from '@faker-js/faker';
import Météo, { météos } from '@/server/domain/chantier/Météo.interface';

class MétéoFixture {
  générer(): Météo {
    return faker.helpers.arrayElement(météos);
  }
}

export default new MétéoFixture();
