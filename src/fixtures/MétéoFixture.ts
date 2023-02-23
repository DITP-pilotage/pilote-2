import { faker } from '@faker-js/faker';
import { Météo, météos } from '@/server/domain/météo/Météo.interface';

class MétéoFixture {
  générer(): Météo {
    return faker.helpers.arrayElement(météos);
  }
}

const météoFixture = new MétéoFixture();
export default météoFixture;
