import { faker } from '@faker-js/faker';
import Indicateur, {
  typesIndicateur,
} from '@/server/domain/indicateur/Indicateur.interface';
import { codeInseeDépartements, codeInseeRégions } from '@/fixtures/codesInsee';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import FixtureInterface from './Fixture.interface';
import { générerUnIdentifiantUnique } from './utils';

class IndicateurFixture implements FixtureInterface<Indicateur> {
  
  private générerFakeIndicateurTerritorialisé(codesInseeTerritoires: CodeInsee[]): IndicateurDonnéesTerritoires {
    const result: IndicateurDonnéesTerritoires = {};
    codesInseeTerritoires.forEach((codeInsee) => {
      result[codeInsee] = {
        codeInsee: codeInsee,
        valeurInitiale: faker.helpers.arrayElement([null, faker.datatype.number({ max: 99 })]),
        valeurActuelle: faker.helpers.arrayElement([null, faker.datatype.number({ min: 99, max: 199 })]),
        valeurCible: faker.helpers.arrayElement([null, faker.datatype.number({ min: 199, max: 250 })]),
        tauxAvancementGlobal: faker.helpers.arrayElement([null, faker.datatype.number({ min: 0, max: 100, precision: 0.01 })]),
        evolutionValeurActuelle: [25, 65, 150, 199],
        evolutionDateValeurActuelle: ['2021-06-30', '2022-06-30', '2023-06-30', '2024-06-30'],
        dateValeurInitiale: '2020-01-01',
        dateValeurActuelle: '2023-02-01',
      };
    });
    return result;
  }

  générer(valeursFixes: Partial<Indicateur> = {}): Indicateur {
    return {
      id: générerUnIdentifiantUnique('IND'),
      nom: faker.lorem.words(5),
      type: faker.helpers.arrayElement(typesIndicateur),
      estIndicateurDuBaromètre: faker.datatype.boolean(),
      source: 'ma source',
      description: 'ma description',
      modeDeCalcul: 'mon mode de calcul',
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Indicateur>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

const indicateurFixture = new IndicateurFixture();
export default indicateurFixture;
