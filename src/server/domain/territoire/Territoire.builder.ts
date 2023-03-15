import { faker } from '@faker-js/faker';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance, Territoire } from '@/server/domain/territoire/Territoire.interface';
import MétéoBuilder from '../météo/Météo.builder';
import AvancementBuilder from '../avancement/Avancement.builder';

export default class TerritoireBuilder {
  private _codeInsee: Territoire['codeInsee'];

  private _avancement: Territoire['avancement'];

  private _météo: Territoire['météo'];

  constructor() {
    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._avancement = new AvancementBuilder().build();
    this._météo = new MétéoBuilder().build();
  }

  avecCodeInsee(codeInsee: typeof this._codeInsee): TerritoireBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecAvancement(avancement: typeof this._avancement): TerritoireBuilder {
    this._avancement = avancement;
    return this;
  }

  avecMétéo(météo: typeof this._météo): TerritoireBuilder {
    this._météo = météo;
    return this;
  }

  build(): Territoire {
    return {
      codeInsee: this._codeInsee,
      avancement: this._avancement,
      météo: this._météo,
    };
  }
}
