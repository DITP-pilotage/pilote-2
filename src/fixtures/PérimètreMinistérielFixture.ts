import { faker } from '@faker-js/faker';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import FixtureInterface from './Fixture.interface';
import { générerUnIdentifiantUnique } from './utils';

class PérimètreMinistérielFixture implements FixtureInterface<PérimètreMinistériel> {
  générer(valeursFixes: Partial<PérimètreMinistériel> = {}) {
    return {
      id: générerUnIdentifiantUnique('PER'),
      nom: faker.lorem.words(4),
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<PérimètreMinistériel>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

const périmètreMinistérielFixture = new PérimètreMinistérielFixture();
export default périmètreMinistérielFixture;
