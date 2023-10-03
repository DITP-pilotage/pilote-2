import { faker } from '@faker-js/faker/locale/fr';
import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { codesInseeDépartements, codesInseeRégions, codeInseeFrance } from '@/server/domain/territoire/Territoire.interface';
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

  constructor() {
    const nombreDeValeurs = faker.datatype.number({ min: 28, max: 35 });

    this._codeInsee = faker.helpers.arrayElement([...codesInseeDépartements, ...codesInseeRégions, codeInseeFrance]);
    this._valeurInitiale = faker.datatype.number({ precision: 0.01 });
    this._dateValeurInitiale = new Date('2020-06-01T00:00:00.000Z').toISOString();
    this._valeurCible = faker.datatype.number({ min: this._valeurInitiale ?? 42, precision: 0.01 });
    this._valeurActuelle = faker.datatype.number({ min: this._valeurInitiale ?? 30, precision: 0.01 });
    this._dateValeurCible = faker.date.future(3, '2024-06-01T00:00:00.000Z').toISOString();
    this._dateValeurActuelle = new Date('2023-03-01T00:00:00.000Z').toISOString();
    this._dateValeurCibleAnnuelle = faker.date.future(1, '2023-03-01T00:00:00.000Z').toISOString();
    this._valeurCibleAnnuelle = faker.datatype.number({ min: this._valeurInitiale ?? 42, max: this._valeurCible ?? 39, precision: 0.01 });
    this._unité = générerPeutÊtreNull(0.2, faker.lorem.paragraph(2));
    this._est_applicable = générerPeutÊtreNull(0.2, faker.datatype.boolean());

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

  avecValeurActuelle(valeurActuelle: DétailsIndicateur['valeurActuelle']): DétailsIndicateurBuilder {
    this._valeurActuelle = valeurActuelle;
    return this;
  }

  avecDateValeurActuelle(dateValeurActuelle: DétailsIndicateur['dateValeurActuelle']): DétailsIndicateurBuilder {
    this._dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  avecAvancement(avancement: DétailsIndicateur['avancement']): DétailsIndicateurBuilder {
    this._avancement = avancement;
    return this;
  }

  avecValeurCibleAnnuelle(valeurCibleAnnuelle: DétailsIndicateur['valeurCibleAnnuelle']): DétailsIndicateurBuilder {
    this._valeurCibleAnnuelle = valeurCibleAnnuelle;
    return this;
  }

  avecDateValeurCibleAnnuelle(dateValeurCibleAnnuelle: DétailsIndicateur['dateValeurCibleAnnuelle']): DétailsIndicateurBuilder {
    this._dateValeurCibleAnnuelle = dateValeurCibleAnnuelle;
    return this;
  }

  avecEstApplicable(est_applicable: DétailsIndicateur['est_applicable']): DétailsIndicateurBuilder {
    this._est_applicable = est_applicable;
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
      valeurActuelle: this._valeurActuelle,
      dateValeurActuelle: this._dateValeurActuelle,
      dateValeurCibleAnnuelle: this._dateValeurCibleAnnuelle,
      valeurCibleAnnuelle: this._valeurCibleAnnuelle,
      avancement: this._avancement,
      unité: this._unité,
      est_applicable: this._est_applicable,
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
