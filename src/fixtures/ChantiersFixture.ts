import { faker } from '@faker-js/faker';
import Chantier, { Météo } from '@/server/domain/chantier/Chantier.interface';
import { générerCaractèresSpéciaux } from '@/client/utils/strings';
import { Avancement } from '@/server/domain/chantier/ChantierAvancement.interface';
import FixtureInterface from './Fixture.interface';

const générerValeurMétéo = (): Météo => {
  return Math.random() > 0.8 ? null : Math.ceil(Math.random() * 4) as Météo ;
};

const générerValeurAvancement = (): Avancement | null => {
  const estNonRenseignée = Math.random() > 0.9;
  const valeursTriées = Array.from({ length: 4 })
    .map(() => Math.random())
    .sort();

  return estNonRenseignée
    ? null
    : {
      minimum: valeursTriées[0],
      médiane: valeursTriées[1],
      moyenne: valeursTriées[2],
      maximum: valeursTriées[3],
    };
};

const ChantiersFixture: FixtureInterface<Chantier> = {
  générer(valeursFixes: Partial<Chantier> = {}) {
    return {
      id: `CH-${faker.random.alphaNumeric(5)}`,
      nom: `${faker.lorem.words(10)} ${générerCaractèresSpéciaux(3)}`,
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
