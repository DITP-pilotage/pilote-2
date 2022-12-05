import FixtureInterface from './Fixture.interface';
import Chantier from '../server/domain/chantier/chantier.interface';
import { faker } from '@faker-js/faker';

const ChantiersFixture: FixtureInterface<Chantier> = {
  générer(valeursFixes: Partial<Chantier> = {}) {
    return {
      id: faker.random.alphaNumeric(5),
      nom: faker.lorem.words(10),
      id_périmètre: faker.random.alphaNumeric(5),
      ...valeursFixes,
    };
  },

  générerPlusieurs(quantité: number, valeursFixes: Partial<Chantier>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  },
};

export default ChantiersFixture;
