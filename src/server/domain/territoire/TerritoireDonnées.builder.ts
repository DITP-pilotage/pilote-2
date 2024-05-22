import { faker } from '@faker-js/faker/locale/fr';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance, TerritoireDonnées } from '@/server/domain/territoire/Territoire.interface';
import MétéoBuilder from '@/server/domain/météo/Météo.builder';
import AvancementBuilder from '@/server/domain/chantier/avancement/Avancement.builder';
import { générerPeutÊtreNull, générerTableau } from '@/server/infrastructure/test/builders/utils';

export default class TerritoireDonnéesBuilder {
  private _codeInsee: TerritoireDonnées['codeInsee'];

  private _avancement: TerritoireDonnées['avancement'];

  private _avancementPrécédent: TerritoireDonnées['avancementPrécédent'];

  private _météo: TerritoireDonnées['météo'];

  private _écart: TerritoireDonnées['écart'];

  private _tendance: TerritoireDonnées['tendance'];

  private _dateDeMàjDonnéesQualitatives: TerritoireDonnées['dateDeMàjDonnéesQualitatives'];

  private _dateDeMàjDonnéesQuantitatives: TerritoireDonnées['dateDeMàjDonnéesQuantitatives'];

  private _estApplicable: TerritoireDonnées['estApplicable'];

  private _responsableLocal: TerritoireDonnées['responsableLocal'];

  private _coordinateurTerritorial: TerritoireDonnées['coordinateurTerritorial'];

  constructor() {

    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._avancement = new AvancementBuilder().build();
    this._avancementPrécédent = faker.helpers.arrayElement([this._avancement, new AvancementBuilder().build()]);
    this._météo = new MétéoBuilder().build();
    this._écart = faker.datatype.number({ min: -20, max: 20, precision: 3 });
    this._tendance = faker.helpers.arrayElement(['BAISSE', 'HAUSSE', 'STAGNATION', null]);
    this._dateDeMàjDonnéesQualitatives = générerPeutÊtreNull(0.2, faker.date.past().toISOString());
    this._dateDeMàjDonnéesQuantitatives = générerPeutÊtreNull(0.2, faker.date.past().toISOString());
    this._estApplicable = générerPeutÊtreNull(0.2, faker.datatype.boolean());
    this._coordinateurTerritorial = générerTableau(1, 3, () => ({ nom: faker.name.fullName(), email: faker.internet.email() }));
    this._responsableLocal = générerTableau(1, 3, () => ({ nom: faker.name.fullName(), email: faker.internet.email() }));
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

  avecDateDeMàjDonnéesQualitatives(dateDeMàjDonnéesQualitatives: TerritoireDonnées['dateDeMàjDonnéesQualitatives']): TerritoireDonnéesBuilder {
    this._dateDeMàjDonnéesQualitatives = dateDeMàjDonnéesQualitatives;
    return this;
  }

  avecDateDeMàjDonnéesQuantitatives(dateDeMàjDonnéesQuantitatives: TerritoireDonnées['dateDeMàjDonnéesQuantitatives']): TerritoireDonnéesBuilder {
    this._dateDeMàjDonnéesQuantitatives = dateDeMàjDonnéesQuantitatives;
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
      dateDeMàjDonnéesQualitatives: this._dateDeMàjDonnéesQualitatives,
      dateDeMàjDonnéesQuantitatives: this._dateDeMàjDonnéesQuantitatives,
      estApplicable: this._estApplicable,
      responsableLocal: this._responsableLocal,
      coordinateurTerritorial: this._coordinateurTerritorial,
    };
  }
}
