import { faker } from '@faker-js/faker/locale/fr';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance, TerritoireDonnées } from '@/server/domain/territoire/Territoire.interface';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import AvancementBuilder from '@/server/domain/chantier/avancement/Avancement.builder';

export default class TerritoireDonnéesBuilder {
  private _codeInsee: TerritoireDonnées['codeInsee'];

  private _avancement: TerritoireDonnées['avancement'];

  private _météo: TerritoireDonnées['météo'];

  constructor() {
    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._avancement = new AvancementBuilder().build();
    this._météo = new MétéoBuilder().build();
  }

  avecCodeInsee(codeInsee: TerritoireDonnées['codeInsee']): TerritoireDonnéesBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecAvancement(avancement: TerritoireDonnées['avancement']): TerritoireDonnéesBuilder {
    this._avancement = avancement;
    return this;
  }

  avecMétéo(météo: TerritoireDonnées['météo']): TerritoireDonnéesBuilder {
    this._météo = météo;
    return this;
  }

  build(): TerritoireDonnées {
    return {
      codeInsee: this._codeInsee,
      avancement: this._avancement,
      météo: this._météo,
    };
  }
}
