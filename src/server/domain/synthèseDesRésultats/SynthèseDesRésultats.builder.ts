import { faker } from '@faker-js/faker/locale/fr';
import SynthèseDesRésultats  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';

export default class SynthèseDesRésultatsBuilder {
  private _synthèseDesRésultats: SynthèseDesRésultats;

  constructor() {
    this._synthèseDesRésultats = générerPeutÊtreNull(0.1, this._générerUneSynthèseDesRésultat());
  }

  private _générerUneSynthèseDesRésultat() {
    return {
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
      id: faker.datatype.uuid(),
      météo: new MétéoBuilder().build(),
    };
  }

  avecSynthèseDesRésultats(synthèseDesRésultats: SynthèseDesRésultats): SynthèseDesRésultatsBuilder {
    this._synthèseDesRésultats = synthèseDesRésultats;
    return this;
  }

  build(): SynthèseDesRésultats {
    return this._synthèseDesRésultats;
  }
}
