import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { valeursType } from '@/server/domain/indicateur/Type.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import FixtureInterface from './Fixture.interface';

class ChantierFixture implements FixtureInterface<Chantier> {
  générer(valeursFixes: Partial<Chantier> = {}) {
    const valeurs = Array.from({ length: 8 }, () => faker.datatype.number({ min: 0, max: 100 }) / 100);
    valeurs.sort();
    const perimetreId = 'PER-' + faker.random.numeric(3);
    return {
      id: 'CH-' + faker.random.numeric(3),
      nom: faker.lorem.words(3),
      axe: { id: 'AXE-' + faker.random.alphaNumeric(3), nom: faker.lorem.words(3) },
      nomPPG: faker.lorem.words(3),
      périmètreIds: [perimetreId],
      zoneNom: 'National',
      codeInsee: 'FR',
      maille: 'NAT',
      météo: MétéoFixture.générer(),
      avancement: {
        annuel: { minimum: valeurs[0], médiane: valeurs[2], moyenne: valeurs[4], maximum: valeurs[6] },
        global: { minimum: valeurs[1], médiane: valeurs[3], moyenne: valeurs[5], maximum: valeurs[7] },
      },
      indicateurs: this.générerIndicateurs(5),
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Chantier>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }

  private générerIndicateurs(nombreIndicateurs: number): Indicateur[] {
    const indicateurs: Indicateur[] = [];
    for (let i = 0; i < nombreIndicateurs; i++) {
      indicateurs.push({
        id: 'IND-' + ('' + i).padStart(3, '0'),
        nom: faker.lorem.words(5),
        type: valeursType[faker.datatype.number({ min: 0, max: valeursType.length - 1 })],
        estIndicateurDuBaromètre: i % 3 == 0,
        valeurInitiale: i % 2 == 0 ? null : faker.datatype.number(),
        valeurActuelle: i % 4 == 0 ? null : faker.datatype.number(),
        valeurCible: i % 5 == 0 ? null : faker.datatype.number(),
        tauxAvancementGlobal: i % 2 == 0 ? null : faker.datatype.float({ min: 0, max: 1 }),
      });
    }
    return indicateurs;
  }
}

export default new ChantierFixture();
