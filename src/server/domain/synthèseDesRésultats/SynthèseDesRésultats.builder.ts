import { faker } from '@faker-js/faker';
import SynthèseDesRésultats  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default class SynthèseDesRésultatBuilder {
  private _synthèseDesRésultats: SynthèseDesRésultats;

  constructor() {
    this._synthèseDesRésultats = faker.helpers.arrayElement([null, this._générerUneSynthèseDesRésultat()]);
  }

  private _générerUneSynthèseDesRésultat() {
    return {
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(10, '2023-02-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
    };
  }

  avecSynthèseDesRésultats(synthèseDesRésultats: typeof this._synthèseDesRésultats): SynthèseDesRésultatBuilder {
    this._synthèseDesRésultats = synthèseDesRésultats;
    return this;
  }

  build(): SynthèseDesRésultats {
    return this._synthèseDesRésultats;
  }
}
