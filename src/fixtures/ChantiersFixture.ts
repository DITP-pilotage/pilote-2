import { faker } from '@faker-js/faker';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import FixtureInterface from './Fixture.interface';

const générerValeurMétéo = () => {
  return Math.random() > 0.8 ? null : Math.ceil(Math.random() * 4) as 1 | 2 | 3 | 4 ;
};

const générerValeurAvancement = () => {
  return Math.random() > 0.9 ? null : Math.random();
};

const ChantiersFixture: FixtureInterface<Chantier> = {
  générer(valeursFixes: Partial<Chantier> = {}) {
    return {
      id: `CH-${faker.random.alphaNumeric(5)}`,
      nom: faker.lorem.words(10),
      id_périmètre: `PER-${faker.random.alphaNumeric(5)}`,
      météo: générerValeurMétéo(),
      avancement: {
        annuel: générerValeurAvancement(),
        global: générerValeurAvancement(),
      },
      ...valeursFixes,
    };
  },

  générerPlusieurs(quantité: number, valeursFixes: Partial<Chantier>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  },
};

export default ChantiersFixture;
