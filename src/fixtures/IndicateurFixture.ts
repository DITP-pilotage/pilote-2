import { faker } from '@faker-js/faker';
import Indicateur, {
  IndicateurDonnéesTerritoires,
  typesIndicateur,
} from '@/server/domain/indicateur/Indicateur.interface';
import FixtureInterface from './Fixture.interface';
import { générerUnIdentifiantUnique } from './utils';

class IndicateurFixture implements FixtureInterface<Indicateur> {
  // TODO refactor avec ChantierFixture
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

  // TODO refactor avec ChantierFixture
  private readonly code_insee_régions = [
    '01', '02', '03', '04', '06', '11', '24', '27', '28', '32', '44', '52', '53', '75',
    '76', '84', '93', '94',
  ];

  générer(valeursFixes: Partial<Indicateur> = {}): Indicateur {
    return {
      id: générerUnIdentifiantUnique('IND'),
      nom: faker.lorem.words(5),
      type: faker.helpers.arrayElement(typesIndicateur),
      estIndicateurDuBaromètre: faker.datatype.boolean(),
      mailles: {
        nationale: this.générérFakeIndicateurTerritorialisé(['FR']),
        régionale: this.générérFakeIndicateurTerritorialisé(this.code_insee_régions),
        départementale: this.générérFakeIndicateurTerritorialisé(this.code_insee_départements),
      },
      ...valeursFixes,
    };
  }

  private générérFakeIndicateurTerritorialisé(code_insee_territoire: string[]): IndicateurDonnéesTerritoires {
    const result: IndicateurDonnéesTerritoires = {};
    code_insee_territoire.forEach((code_insee) => {
      result[code_insee] = {
        codeInsee: code_insee,
        valeurInitiale: faker.helpers.arrayElement([null, faker.datatype.number({ max: 99 })]),
        valeurActuelle: faker.helpers.arrayElement([null, faker.datatype.number({ min: 99, max: 199 })]),
        valeurCible: faker.helpers.arrayElement([null, faker.datatype.number({ min: 199, max: 250 })]),
        tauxAvancementGlobal: faker.helpers.arrayElement([null, faker.datatype.number({ min: 0, max: 100, precision: 0.01 })]),
        evolutionValeurActuelle: [1, 2, 3, 4],
        evolutionDateValeurActuelle: ['2021-06-30', '2022-06-30', '2023-06-30', '2024-06-30'],
        dateValeurInitiale: '2020-01-01',
        dateValeurActuelle: '2023-02-01',
      };
    });
    return result;
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Indicateur>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

const indicateurFixture = new IndicateurFixture();
export default indicateurFixture;
