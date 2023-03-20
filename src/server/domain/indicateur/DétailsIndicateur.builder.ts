import { faker } from '@faker-js/faker/locale/fr';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance } from '@/server/domain/territoire/Territoire.interface';
import AvancementBuilder from '@/server/domain/avancement/Avancement.builder';

export default class DétailsIndicateurBuilder {
  private _codeInsee: DétailsIndicateur['codeInsee'];

  private _valeurInitiale: DétailsIndicateur['valeurInitiale'];

  private _dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'];

  private _valeurs: DétailsIndicateur['valeurs'];

  private _dateValeurs: DétailsIndicateur['dateValeurs'];

  private _valeurCible: DétailsIndicateur['valeurCible'];

  private _avancement: DétailsIndicateur['avancement'];

  constructor() {
    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._valeurInitiale = faker.helpers.arrayElement([null, faker.datatype.number({ precision: 0.01 })]);
    this._dateValeurInitiale = this._valeurInitiale === null ? null : faker.date.recent(10, '2023-02-01T00:00:00.000Z').toISOString();
    this._valeurs = this._valeurInitiale === null ? [] : [this._valeurInitiale, faker.datatype.number({ min: this._valeurInitiale, precision: 0.01 })];
    this._dateValeurs = this._dateValeurInitiale === null ? [] : [this._dateValeurInitiale, faker.date.between(this._dateValeurInitiale, faker.date.recent(5)).toISOString()];
    this._valeurCible = faker.helpers.arrayElement([null, faker.datatype.number({ min: this._valeurInitiale ?? 42, precision: 0.01 })]);
    this._avancement = new AvancementBuilder().build();
  }

  avecCodeInsee(codeInsee: typeof this._codeInsee): DétailsIndicateurBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecValeurInitiale(valeurInitiale: typeof this._valeurInitiale): DétailsIndicateurBuilder {
    this._valeurInitiale = valeurInitiale;
    return this;
  }

  avecDateValeurInitiale(dateValeurInitiale: typeof this._dateValeurInitiale): DétailsIndicateurBuilder {
    this._dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  avecValeurs(valeurs: typeof this._valeurs): DétailsIndicateurBuilder {
    this._valeurs = valeurs;
    return this;
  }

  avecDateValeurs(dateValeurs: typeof this._dateValeurs): DétailsIndicateurBuilder {
    this._dateValeurs = dateValeurs;
    return this;
  }

  avecValeurCible(valeurCible: typeof this._valeurCible): DétailsIndicateurBuilder {
    this._valeurCible = valeurCible;
    return this;
  }

  avecAvancement(avancement: typeof this._avancement): DétailsIndicateurBuilder {
    this._avancement = avancement;
    return this;
  }

  build(): DétailsIndicateur {
    return {
      codeInsee: this._codeInsee,
      valeurInitiale: this._valeurInitiale,
      dateValeurInitiale: this._dateValeurInitiale,
      valeurs: this._valeurs,
      dateValeurs: this._dateValeurs,
      valeurCible: this._valeurCible,
      avancement: this._avancement,
    };
  }
}
