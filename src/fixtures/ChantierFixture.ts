import { faker } from '@faker-js/faker';
import Chantier, { Territoires } from '@/server/domain/chantier/Chantier.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { codeInseeDépartements, codeInseeRégions } from '@/fixtures/codesInsee';
import { générerCaractèresSpéciaux, générerUnIdentifiantUnique } from './utils';

class ChantierFixture implements FixtureInterface<Chantier> {
  générer(valeursFixes: Partial<Chantier> = {}): Chantier {
    return {
      id: générerUnIdentifiantUnique('CH'),
      nom: `${faker.lorem.words(10)} ${générerCaractèresSpéciaux(3)}`,
      axe: { id: générerUnIdentifiantUnique('AXE'), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      périmètreIds: [générerUnIdentifiantUnique('PER')],
      mailles: {
        nationale: this.générérFakeTerritoires(['FR']),
        régionale: this.générérFakeTerritoires(codeInseeRégions),
        départementale: this.générérFakeTerritoires(codeInseeDépartements),
      },
      responsables: {
        porteur: 'Min1',
        coporteurs: ['Min2'],
        directeursAdminCentrale: [{ nom: 'DAC1', direction: 'DAC1' }, { nom: 'DAC2', direction: 'DAC2' }],
        directeursProjet: [],
      },
      estBaromètre: faker.datatype.boolean(),
      ...valeursFixes,
    };
  }

  private générérFakeTerritoires(code_insee_territoire: string[]): Territoires {
    const result: Territoires = {};
    code_insee_territoire.forEach((code_insee) => {
      result[code_insee] = {
        codeInsee: code_insee,
        avancement: {
          annuel: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
          global: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
        },
        météo: MétéoFixture.générer(),
      };
    });
    return result;
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Chantier>[] = []): Chantier[] {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}
const chantierFixture = new ChantierFixture();
export default chantierFixture;
