import { faker } from '@faker-js/faker';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { générerCaractèresSpéciaux, générerUnIdentifiantUnique } from './utils';

class ChantierInfoFixture implements FixtureInterface<ChantierInfo> {
  générer(valeursFixes: Partial<ChantierInfo> = {}): ChantierInfo {
    return {
      id: générerUnIdentifiantUnique('CH'),
      nom: `${faker.lorem.words(10)} ${générerCaractèresSpéciaux(3)}`,
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
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<ChantierInfo>[] = []): ChantierInfo[] {
    return Array.from({ length: quantité })
      .map((_, index) => {
        if (index === quantité - 1) {
          return this.générer({ 
            mailles: {
              nationale: {
                'FR': {
                  codeInsee: 'FR',
                  avancement: { annuel: null, global: null },
                },
              },
              régionale: {},
              départementale: {},
            }, 
            ...valeursFixes[index], 
          });
        }

        return this.générer(valeursFixes[index]);
      });
  }
}

export default new ChantierInfoFixture();
