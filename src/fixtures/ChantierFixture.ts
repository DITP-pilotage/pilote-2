import { faker } from '@faker-js/faker';
import Chantier, { Territoires } from '@/server/domain/chantier/Chantier.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { générerCaractèresSpéciaux, générerUnIdentifiantUnique } from './utils';

class ChantierFixture implements FixtureInterface<Chantier> {
  private readonly code_insee_départements = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13',
    '14', '15', '16', '17', '18', '19', '21', '22', '23', '24', '25', '26', '27',
    '28', '29', '2A', '2B', '30', '31', '32', '33', '34', '35', '36', '37', '38',
    '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51',
    '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64',
    '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77',
    '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
    '91', '92', '93', '94', '95', '971', '972', '973', '974', '976',
  ];

  private readonly code_insee_régions = [
    '01', '02', '03', '04', '06', '11', '24', '27', '28', '32', '44', '52', '53', '75',
    '76', '84', '93', '94',
  ];

  générer(valeursFixes: Partial<Chantier> = {}): Chantier {
    return {
      id: générerUnIdentifiantUnique('CH'),
      nom: `${faker.lorem.words(10)} ${générerCaractèresSpéciaux(3)}`,
      axe: { id: générerUnIdentifiantUnique('AXE'), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      périmètreIds: [générerUnIdentifiantUnique('PER')],
      mailles: {
        nationale: this.générérFakeTerritoires(['FR']),
        régionale: this.générérFakeTerritoires(this.code_insee_régions),
        départementale: this.générérFakeTerritoires(this.code_insee_départements),
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

  private générérFakeTerritoires(code_insee_départements: string[]): Territoires {
    const result: Territoires = {};
    code_insee_départements.forEach((code_insee) => {
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
