import FixtureInterface from './Fixture.interface';
import ChantierFront from '../server/domain/chantier/chantier.interface';
import { faker } from '@faker-js/faker';

const générerValeurMétéo = () => {
  return Math.random() > 0.8 ? null : Math.ceil(Math.random() * 4);
};

const générerValeurAvancement = () => {
  return Math.random() > 0.9 ? null : Math.random();
};

const ChantiersFixture: FixtureInterface<ChantierFront> = {
  générer(valeursFixes: Partial<ChantierFront> = {}) {
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

  générerPlusieurs(quantité: number, valeursFixes: Partial<ChantierFront>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  },
};

export default ChantiersFixture;
