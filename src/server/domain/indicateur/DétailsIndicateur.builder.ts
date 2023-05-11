import { faker } from '@faker-js/faker/locale/fr';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance } from '@/server/domain/territoire/Territoire.interface';
import AvancementBuilder from '@/server/domain/avancement/Avancement.builder';
import { générerTableau } from '@/server/infrastructure/test/builders/utils';

export default class DétailsIndicateurBuilder {
  private _codeInsee: DétailsIndicateur['codeInsee'];

  private _valeurInitiale: DétailsIndicateur['valeurInitiale'];

  private _dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'];

  private _valeurs: DétailsIndicateur['valeurs'];

  private _dateValeurs: DétailsIndicateur['dateValeurs'];

  private _valeurCible: DétailsIndicateur['valeurCible'];

  private _dateValeurCible: DétailsIndicateur['dateValeurCible'];

  private _avancement: DétailsIndicateur['avancement'];

  constructor() {
    const nombreDeValeurs = faker.datatype.number({ min: 28, max: 35 });

    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._valeurInitiale = faker.datatype.number({ precision: 0.01 });
    this._dateValeurInitiale = new Date('2020-06-01T00:00:00.000Z').toISOString();
    this._valeurCible = faker.datatype.number({ min: this._valeurInitiale ?? 42, precision: 0.01 });
    this._dateValeurCible = faker.date.future(3, '2024-06-01T00:00:00.000Z').toISOString();

    const valeursEtDates = this.générerValeursEtDates(nombreDeValeurs, this._valeurInitiale, this._valeurCible);

    this._valeurs = valeursEtDates.valeurs;
    this._dateValeurs = valeursEtDates.dateValeurs;
    this._avancement = new AvancementBuilder().build();
  }

  avecCodeInsee(codeInsee: DétailsIndicateur['codeInsee']): DétailsIndicateurBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecValeurInitiale(valeurInitiale: DétailsIndicateur['valeurInitiale']): DétailsIndicateurBuilder {
    this._valeurInitiale = valeurInitiale;
    return this;
  }

  avecDateValeurInitiale(dateValeurInitiale: DétailsIndicateur['dateValeurInitiale']): DétailsIndicateurBuilder {
    this._dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  avecValeurs(valeurs: DétailsIndicateur['valeurs']): DétailsIndicateurBuilder {
    this._valeurs = valeurs;
    return this;
  }

  avecDateValeurs(dateValeurs: DétailsIndicateur['dateValeurs']): DétailsIndicateurBuilder {
    this._dateValeurs = dateValeurs;
    return this;
  }

  avecValeurCible(valeurCible: DétailsIndicateur['valeurCible']): DétailsIndicateurBuilder {
    this._valeurCible = valeurCible;
    return this;
  }

  avecDateValeurCible(dateValeurCible: DétailsIndicateur['dateValeurCible']): DétailsIndicateurBuilder {
    this._dateValeurCible = dateValeurCible;
    return this;
  }

  avecAvancement(avancement: DétailsIndicateur['avancement']): DétailsIndicateurBuilder {
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
      dateValeurCible: this._dateValeurCible,
      avancement: this._avancement,
    };
  }

  private générerValeursEtDates(nombre: number, valeurActuelle: number, valeurCible: number) {
    const min = Math.min(valeurActuelle, valeurCible);
    const max = Math.max(valeurActuelle, valeurCible);
    return {
      valeurs: générerTableau(nombre, nombre, () => {
        return faker.datatype.number({ min, max, precision: 0.01 });
      }),
      dateValeurs: générerTableau(nombre, nombre, (i) => {
        const date = new Date(this._dateValeurInitiale ?? '2020-06-01');
        const dateMoisSuivant = new Date(date.setMonth(date.getMonth() + 1));
        return new Date(dateMoisSuivant.setMonth(dateMoisSuivant.getMonth() + i)).toISOString();
      }),
    };
  }
}
