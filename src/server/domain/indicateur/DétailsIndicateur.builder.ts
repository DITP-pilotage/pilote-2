import { faker } from '@faker-js/faker/locale/fr';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import {
  codeInseeFrance,
  codesInseeDépartements,
  codesInseeRégions,
} from '@/server/domain/territoire/Territoire.interface';
import AvancementBuilder from '@/server/domain/chantier/avancement/Avancement.builder';
import { générerPeutÊtreNull, générerTableau } from '@/server/infrastructure/test/builders/utils';

export default class DétailsIndicateurBuilder {
  private _codeInsee: DétailsIndicateur['codeInsee'];

  private _valeurInitiale: DétailsIndicateur['valeurInitiale'];

  private _dateValeurInitiale: DétailsIndicateur['dateValeurInitiale'];

  private _valeurs: DétailsIndicateur['valeurs'];

  private _dateValeurs: DétailsIndicateur['dateValeurs'];

  private _valeurCible: DétailsIndicateur['valeurCible'];

  private _dateValeurCible: DétailsIndicateur['dateValeurCible'];

  private _valeurActuelle: DétailsIndicateur['valeurActuelle'];

  private _dateValeurActuelle: DétailsIndicateur['dateValeurActuelle'];

  private _avancement: DétailsIndicateur['avancement'];

  private _valeurCibleAnnuelle: DétailsIndicateur['valeurCibleAnnuelle'];

  private _dateValeurCibleAnnuelle: DétailsIndicateur['dateValeurCibleAnnuelle'];

  private _unité: DétailsIndicateur['unité'];
  
  private _est_applicable: DétailsIndicateur['est_applicable'];

  private _dateImport: DétailsIndicateur['dateImport'];

  private _pondération: DétailsIndicateur['pondération'];

  private _tendance: DétailsIndicateur['tendance'];

  private _prochaineDateValeurActuelle: DétailsIndicateur['prochaineDateValeurActuelle'];

  constructor() {
    const nombreDeValeurs = faker.datatype.number({ min: 28, max: 35 });

    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._valeurInitiale = faker.datatype.number({ precision: 0.01 });
    this._dateValeurInitiale = new Date('2020-06-01T00:00:00.000Z').toISOString();
    this._valeurCible = faker.datatype.number({ min: this._valeurInitiale ?? 42, precision: 0.01 });
    this._valeurActuelle = faker.datatype.number({ min: this._valeurInitiale ?? 30, precision: 0.01 });
    this._dateValeurCible = faker.date.future(3, '2025-01-01T00:00:00.000Z').toISOString();
    this._dateValeurActuelle = new Date('2023-03-01T00:00:00.000Z').toISOString();
    this._dateValeurCibleAnnuelle = faker.date.future(2, '2025-03-01T00:00:00.000Z').toISOString();
    this._prochaineDateValeurActuelle = faker.date.future(2, '2023-03-01T00:00:00.000Z').toISOString();
    this._valeurCibleAnnuelle = faker.datatype.number({ min: this._valeurInitiale ?? 42, max: this._valeurCible ?? 39, precision: 0.01 });
    this._unité = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._est_applicable = générerPeutÊtreNull(0.2, faker.datatype.boolean());
    this._dateImport = new Date('2023-05-01T00:00:00.000Z').toISOString();
    this._pondération = faker.datatype.number({ min: 0, max: 100 });
    this._tendance = générerPeutÊtreNull(0.1, faker.datatype.string(6).toUpperCase());

    const valeursEtDates = this.générerValeursEtDates(nombreDeValeurs, this._valeurInitiale, this._valeurCible);

    this._valeurs = valeursEtDates.valeurs;
    this._dateValeurs = valeursEtDates.dateValeurs;
    this._avancement = new AvancementBuilder().build();
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
      valeurActuelle: this._valeurActuelle,
      dateValeurActuelle: this._dateValeurActuelle,
      dateValeurCibleAnnuelle: this._dateValeurCibleAnnuelle,
      valeurCibleAnnuelle: this._valeurCibleAnnuelle,
      avancement: this._avancement,
      unité: this._unité,
      est_applicable: this._est_applicable,
      proposition: null,
      dateImport: this._dateImport,
      pondération: this._pondération,
      prochaineDateMaj: null,
      prochaineDateMajJours: null,
      prochaineDateValeurActuelle: this._prochaineDateValeurActuelle,
      estAJour: false,
      tendance: this._tendance,
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
