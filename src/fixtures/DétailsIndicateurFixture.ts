import { faker } from '@faker-js/faker';
import { DétailsIndicateur, FichesIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { générerUnIdentifiantUnique } from './utils';
import { codeInseeRégions } from './codesInsee';

class DétailsIndicateursFixture {

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

  générerFichesIndicateurs(valeursFixes: { idsIndicateurs: Indicateur['id'][], codesInsee: CodeInsee[] }): FichesIndicateurs {
    const idsIndicateurs = valeursFixes.idsIndicateurs || [générerUnIdentifiantUnique('IND'), générerUnIdentifiantUnique('IND')];
    const codesInsee = valeursFixes.codesInsee || codeInseeRégions;
    const résultat: FichesIndicateurs = {};
    idsIndicateurs.forEach(idIndicateur => {
      résultat[idIndicateur] = this.générerFakeDétailsIndicateurParTerritoires(codesInsee);
    });
    return résultat;
  }
}

const détailsIndicateursFixture = new DétailsIndicateursFixture();
export default détailsIndicateursFixture;
