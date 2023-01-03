import { faker } from '@faker-js/faker';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import { générerCaractèresSpéciaux } from '@/client/utils/strings';
import { Avancement } from '@/server/domain/chantier/ChantierAvancement.interface';
import MétéoFixture from '@/fixtures/MétéoFixture';
import FixtureInterface from './Fixture.interface';

class ChantierInfoFixture implements FixtureInterface<ChantierInfo> {
  générer(valeursFixes: Partial<ChantierInfo> = {}) {
    return {
      id: `CH-${faker.random.alphaNumeric(5)}`,
      nom: `${faker.lorem.words(10)} ${générerCaractèresSpéciaux(3)}`,
      périmètreIds: [`PER-${faker.random.alphaNumeric(5)}`],
      météo: MétéoFixture.générer(),
      avancement: {
        annuel: this.générerValeurAvancement(),
        global: this.générerValeurAvancement(),
      },
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<ChantierInfo>[] = []) {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }

  private générerValeurAvancement(): Avancement | null {
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
  }
}

export default new ChantierInfoFixture();
