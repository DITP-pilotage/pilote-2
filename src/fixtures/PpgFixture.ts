import { faker } from '@faker-js/faker';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { générerCaractèresSpéciaux, générerUnIdentifiantUnique } from '@/fixtures/utils';
import Ppg from '@/server/domain/ppg/Ppg.interface';

class PpgFixture implements FixtureInterface<Ppg> {
  générer(valeursFixes?: Partial<Ppg>): Ppg {
    return {
      id: générerUnIdentifiantUnique('AXE'),
      nom: `${faker.lorem.words(8)} ${générerCaractèresSpéciaux(2)}`,
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Ppg>[] = []): Ppg[] {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

const axeFixture = new PpgFixture();
export default axeFixture;
