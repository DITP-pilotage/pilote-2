import { faker } from '@faker-js/faker';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { Axe } from '@/server/domain/chantier/Chantier.interface';
import { générerCaractèresSpéciaux, générerUnIdentifiantUnique } from '@/fixtures/utils';

class AxeFixture implements FixtureInterface<Axe> {
  générer(valeursFixes?: Partial<Axe>): Axe {
    return {
      id: générerUnIdentifiantUnique('AXE'),
      nom: `${faker.lorem.words(8)} ${générerCaractèresSpéciaux(2)}`,
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Axe>[] = []): Axe[] {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

const axeFixture = new AxeFixture();
export default axeFixture;
