import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import IndicateurFixture from '@/fixtures/IndicateurFixture';
import FixtureInterface from '@/fixtures/Fixture.interface';

class ChantierFixture implements FixtureInterface<Chantier> {
  générer(valeursFixes: Partial<Chantier> = {}) {
    const valeurs = Array.from({ length: 8 }, () => faker.datatype.number({ min: 0, max: 100 }) / 100);
    valeurs.sort();

    return {
      id: 'CH-' + faker.random.numeric(3),
      nom: faker.lorem.words(3),
      axe: { id: 'AXE-' + faker.random.alphaNumeric(3), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      périmètreIds: ['PER-' + faker.random.numeric(3)],
      zoneNom: 'National',
      codeInsee: 'FR',
      maille: 'NAT',
      météo: MétéoFixture.générer(),
      avancement: {
        annuel: { minimum: valeurs[0], médiane: valeurs[2], moyenne: valeurs[4], maximum: valeurs[6] },
        global: { minimum: valeurs[1], médiane: valeurs[3], moyenne: valeurs[5], maximum: valeurs[7] },
      },
      indicateurs: IndicateurFixture.générerPlusieurs(5),
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Chantier>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

export default new ChantierFixture();
