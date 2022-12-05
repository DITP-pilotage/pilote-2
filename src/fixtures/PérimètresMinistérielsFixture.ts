import FixtureInterface from './Fixture.interface';
import PérimètreMinistériel from '../server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import { faker } from '@faker-js/faker';

const PérimètresMinistérielsFixture: FixtureInterface<PérimètreMinistériel> = {
  générer(valeursFixes: Partial<PérimètreMinistériel> = {}) {
    return {
      id: faker.random.alphaNumeric(5),
      nom: faker.lorem.words(10),
      ...valeursFixes,
    };
  },

  générerPlusieurs(quantité: number, valeursFixes: Partial<PérimètreMinistériel>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  },
};

export default PérimètresMinistérielsFixture;
