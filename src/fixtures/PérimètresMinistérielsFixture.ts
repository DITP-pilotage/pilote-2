import { faker } from '@faker-js/faker';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';
import FixtureInterface from './Fixture.interface';

const PérimètresMinistérielsFixture: FixtureInterface<PérimètreMinistériel> = {
  générer(valeursFixes: Partial<PérimètreMinistériel> = {}) {
    return {
      id: `PER-${faker.random.alphaNumeric(5)}`,
      nom: faker.lorem.words(4),
      ...valeursFixes,
    };
  },

  générerPlusieurs(quantité: number, valeursFixes: Partial<PérimètreMinistériel>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  },
};

export default PérimètresMinistérielsFixture;
