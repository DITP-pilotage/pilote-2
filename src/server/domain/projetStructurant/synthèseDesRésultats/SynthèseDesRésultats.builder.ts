import { faker } from '@faker-js/faker/locale/fr';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import { générerPeutÊtreNull } from '@/server/infrastructure/test/builders/utils';
import SynthèseDesRésultatsProjetStructurant from './SynthèseDesRésultats.interface';

export default class SynthèseDesRésultatsProjetStructurantBuilder {
  private _synthèseDesRésultats: SynthèseDesRésultatsProjetStructurant;

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

  nonNull() {
    this._synthèseDesRésultats = this._générerUneSynthèseDesRésultat();
    return this;
  }

  avecSynthèseDesRésultats(synthèseDesRésultats: SynthèseDesRésultatsProjetStructurant): SynthèseDesRésultatsProjetStructurantBuilder {
    this._synthèseDesRésultats = synthèseDesRésultats;
    return this;
  }

  build(): SynthèseDesRésultatsProjetStructurant {
    return this._synthèseDesRésultats;
  }
}
