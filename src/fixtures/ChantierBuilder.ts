import { TerritoiresBuilder } from './TerritoiresBuilder';
import { faker } from '@faker-js/faker';
import Chantier, { Territoires } from '@/server/domain/chantier/Chantier.interface';
import IndicateurFixture from './IndicateurFixture';
import MétéoFixture from './MétéoFixture';
import { générerUnIdentifiantUnique, générerCaractèresSpéciaux } from './utils';

export class ChantierBuilder {
  private _chantier: Chantier;

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
    '1', '2', '3', '4', '6', '11', '24', '27', '28', '32', '44', '52', '53', '75',
    '76', '84', '93', '94',
  ];

  constructor() {
    this._chantier = {
      id: générerUnIdentifiantUnique('CH'),
      nom: `${faker.lorem.words(10)} ${générerCaractèresSpéciaux(3)}`,
      axe: { id: générerUnIdentifiantUnique('AXE'), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      périmètreIds: [générerUnIdentifiantUnique('PER')],
      météo: MétéoFixture.générer(),
      mailles: {
        nationale: new TerritoiresBuilder(['FR']).construire(),
        régionale: new TerritoiresBuilder(this.code_insee_régions).construire(),
        départementale: new TerritoiresBuilder(this.code_insee_départements).construire(),
      },
      indicateurs: IndicateurFixture.générerPlusieurs(5),
      directeurProjet: faker.name.fullName(),
      directeurAdministrationCentrale: [générerUnIdentifiantUnique('DAC')],
      ministères: [générerUnIdentifiantUnique('MIN')],
    };
  }

  avecPérimètreIds(périmètreIds: string[]) {
    this._chantier.périmètreIds = périmètreIds;
    return this;
  }

  avecMailleRégionale(territoires: Territoires) {
    this._chantier.mailles.régionale = territoires;
    return this;
  }

  construire() {
    return this._chantier;
  }
}
