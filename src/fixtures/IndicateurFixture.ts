import { faker } from '@faker-js/faker';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { valeursType } from '@/server/domain/indicateur/Type.interface';
import FixtureInterface from './Fixture.interface';

class IndicateurFixture implements FixtureInterface<Indicateur> {
  générer(valeursFixes: Partial<Indicateur> = {}) {
    return {
      id: 'IND-' + faker.random.numeric(3),
      nom: faker.lorem.words(5),
      type: valeursType[faker.datatype.number({ min: 0, max: valeursType.length - 1 })],
      estIndicateurDuBaromètre: faker.datatype.boolean(),
      valeurInitiale: faker.helpers.arrayElement([null, faker.datatype.number({ max: 99 })]),
      valeurActuelle: faker.helpers.arrayElement([null, faker.datatype.number({ min: 99, max: 199 })]),
      valeurCible: faker.helpers.arrayElement([null, faker.datatype.number({ min: 199, max: 250 })]),
      tauxAvancementGlobal: faker.helpers.arrayElement([null, faker.datatype.number({ min: 0, max: 100, precision: 0.01 })]),
      ...valeursFixes,
    }; 
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Indicateur>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

export default new IndicateurFixture();
