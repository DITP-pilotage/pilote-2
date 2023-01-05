import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { générerUnIdentifiantUnique } from './utils';

class ChantierFixture implements FixtureInterface<Chantier> {
  générer(valeursFixes: Partial<Chantier> = {}): Chantier {
    const valeurs = Array.from({ length: 8 }, () => faker.datatype.number({ min: 0, max: 100 }) / 100);
    valeurs.sort();

    return {
      id: générerUnIdentifiantUnique('CH'),
      nom: faker.lorem.words(3),
      axe: { id: générerUnIdentifiantUnique('AXE'), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      périmètreIds: [générerUnIdentifiantUnique('PER')],
      météo: MétéoFixture.générer(),
      mailles: {
        nationale: {
          'FR': {
            codeInsee: 'FR',
            avancement: {
              annuel: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
              global: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
            },
          },
        },
        régionale: {},
        départementale: {},
      },
      avancement: {
        annuel: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
        global: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
      },
      indicateurs: IndicateurFixture.générerPlusieurs(5),
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Chantier>[] = []): Chantier[] {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

export default new ChantierFixture();
