import { faker } from '@faker-js/faker/locale/fr';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance, TerritoireDonnées } from '@/server/domain/territoire/Territoire.interface';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import AvancementBuilder from '@/server/domain/chantier/avancement/Avancement.builder';

export default class TerritoireDonnéesBuilder {
  private _codeInsee: TerritoireDonnées['codeInsee'];

  private _avancement: TerritoireDonnées['avancement'];

  private _avancementPrécédent: TerritoireDonnées['avancementPrécédent'];

  private _météo: TerritoireDonnées['météo'];

  private _écart: TerritoireDonnées['écart'];

  private _tendance: TerritoireDonnées['tendance'];

  private _alertes: TerritoireDonnées['alertes'];

  constructor() {
    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._avancement = new AvancementBuilder().build();
    this._avancementPrécédent = new AvancementBuilder().build();
    this._météo = new MétéoBuilder().build();
    this._écart = faker.datatype.number({ min: -20, max: 20, precision: 3 });
    this._tendance = faker.helpers.arrayElement(['BAISSE', 'HAUSSE', 'STAGNATION', null]);
    this._alertes = {
      estEnAlerteÉcart: this._écart < -10,
      estEnAlerteTendance: this._tendance !== 'HAUSSE',
      estEnAlerteNonMaj: faker.helpers.arrayElement([true, false]),
    };
  }

  avecCodeInsee(codeInsee: TerritoireDonnées['codeInsee']): TerritoireDonnéesBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecAvancement(avancement: TerritoireDonnées['avancement']): TerritoireDonnéesBuilder {
    this._avancement = avancement;
    return this;
  }

  avecAvancementPrécédent(avancementPrécédent: TerritoireDonnées['avancementPrécédent']): TerritoireDonnéesBuilder {
    this._avancementPrécédent = avancementPrécédent;
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
      avancementPrécédent: this._avancementPrécédent,
      météo: this._météo,
      écart: this._écart,
      tendance: this._tendance,
      alertes: this._alertes,
    };
  }
}
