import { faker } from '@faker-js/faker';
import Indicateur, { typesIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import {  codeInseeRégions } from '@/fixtures/codesInsee';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DétailsIndicateur, DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import FixtureInterface from './Fixture.interface';
import { générerUnIdentifiantUnique } from './utils';

class IndicateurFixture implements FixtureInterface<Indicateur> {

  private générerFakeDétailsIndicateur(codeInsee: CodeInsee): DétailsIndicateur {
    return {
      codeInsee: codeInsee,
      valeurInitiale: faker.helpers.arrayElement([null, faker.datatype.number({ max: 99 })]),
      dateValeurInitiale: '2020-01-01',
      valeurs: [25, 65, 150, 199],
      dateValeurs: ['2021-06-30', '2022-06-30', '2023-06-30', '2024-06-30'],
      valeurCible: faker.helpers.arrayElement([null, faker.datatype.number({ min: 199, max: 250 })]),
      avancement: {
        annuel: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
        global: faker.datatype.number({ min: 0, max: 100, precision: 0.01 }),
      },
    };
  }

  private générerFakeDétailsIndicateurParTerritoires(codesInsee: CodeInsee[]) {
    const résultat: Record<CodeInsee, DétailsIndicateur> = {};
    codesInsee.forEach(codeInsee => {
      résultat[codeInsee] = this.générerFakeDétailsIndicateur(codeInsee);
    });
    return résultat;
  }


  générerDétailsIndicateurs(idsIndicateurs?: Indicateur['id'][], codesInsee?: CodeInsee[]): DétailsIndicateurs {
    const résultat: DétailsIndicateurs = {};
    (idsIndicateurs || [générerUnIdentifiantUnique('IND')]).forEach(idIndicateur => {
      résultat[idIndicateur] = this.générerFakeDétailsIndicateurParTerritoires(codesInsee || codeInseeRégions);
    });
    return résultat;
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
