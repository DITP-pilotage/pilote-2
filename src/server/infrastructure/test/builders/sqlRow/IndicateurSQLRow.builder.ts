import { indicateur } from '@prisma/client';
import { faker } from '@faker-js/faker';
import IndicateurBuilder from '@/server/domain/indicateur/Indicateur.builder';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import DétailsIndicateurBuilder from '@/server/domain/indicateur/DétailsIndicateur.builder';
import { générerUneMailleAléatoire, retourneUneListeDeCodeInseeCohérentePourUneMaille } from '@/server/infrastructure/test/builders/utils';

export default class IndicateurRowBuilder {
  private _id: indicateur['id'];

  private _nom: indicateur['nom'];

  private _chantierId: indicateur['chantier_id'];

  private _valeurCible: indicateur['objectif_valeur_cible'];

  private _tauxAvancementCible: indicateur['objectif_taux_avancement'];

  private _dateValeurCible: indicateur['objectif_date_valeur_cible'];

  private _typeId: indicateur['type_id'];

  private _typeNom: indicateur['type_nom'];

  private _estBaromètre: indicateur['est_barometre'];

  private _estPhare: indicateur['est_phare'];

  private _valeurInitiale: indicateur['valeur_initiale'];

  private _dateValeurInitiale: indicateur['date_valeur_initiale'];

  private _valeurActuelle: indicateur['valeur_actuelle'];

  private _dateValeurActuelle: indicateur['date_valeur_actuelle'];

  private _territoireNom: indicateur['territoire_nom'];

  private _codeInsee: indicateur['code_insee'];

  private _maille: indicateur['maille'];

  private _évolutionValeurActuelle: indicateur['evolution_valeur_actuelle'];

  private _évolutionDateValeurActuelle: indicateur['evolution_date_valeur_actuelle'];

  private _description: indicateur['description'];

  private _source: indicateur['source'];

  private _modeDeCalcul: indicateur['mode_de_calcul'];

  constructor() {
    const indicateurGénéré = new IndicateurBuilder().build();
    const détailsIndicateurGénéré = new DétailsIndicateurBuilder().build();
    const chantierGénéré = new ChantierBuilder().build();
    
    const maille = générerUneMailleAléatoire();
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._id = indicateurGénéré.id;
    this._nom = indicateurGénéré.nom;
    this._chantierId = chantierGénéré.id;
    this._valeurCible = détailsIndicateurGénéré.valeurCible;
    this._tauxAvancementCible = détailsIndicateurGénéré.avancement.global;
    this._dateValeurCible = faker.helpers.arrayElement([null, faker.date.recent(10, '2023-02-01T00:00:00.000Z').getFullYear().toString()]);
    this._typeId = indicateurGénéré.type;
    this._typeNom = faker.lorem.words();
    this._estBaromètre = faker.helpers.arrayElement([null, faker.datatype.boolean()]);
    this._estPhare = faker.helpers.arrayElement([null, faker.datatype.boolean()]);
    this._valeurInitiale = détailsIndicateurGénéré.valeurInitiale;
    this._dateValeurInitiale = this._valeurInitiale === null ? null : faker.date.recent(10, '2023-02-01T00:00:00.000Z');
    this._valeurActuelle = this._valeurInitiale === null ? null : faker.datatype.number({ min: this._valeurInitiale, precision: 0.01 });
    this._dateValeurActuelle = this._dateValeurInitiale === null ? null : faker.date.between(this._dateValeurInitiale, faker.date.recent(5));
    this._territoireNom = faker.helpers.arrayElement([null, faker.address.state()]);
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._maille = maille;
    this._évolutionValeurActuelle = this._valeurInitiale === null ? [] : [this._valeurInitiale, faker.datatype.number({ min: this._valeurInitiale, precision: 0.01 })];
    this._évolutionDateValeurActuelle = this._dateValeurInitiale === null ? [] : [this._dateValeurInitiale, faker.date.between(this._dateValeurInitiale, faker.date.recent(5))];
    this._description = indicateurGénéré.description;
    this._source = indicateurGénéré.source;
    this._modeDeCalcul = indicateurGénéré.modeDeCalcul;
  }

  avecId(id: typeof this._id): IndicateurRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: typeof this._nom): IndicateurRowBuilder {
    this._nom = nom;
    return this;
  }

  avecChantierId(chantierId: typeof this._chantierId): IndicateurRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecValeurCible(valeurCible: typeof this._valeurCible): IndicateurRowBuilder {
    this._valeurCible = valeurCible;
    return this;
  }

  avecTauxAvancementCible(tauxAvancementCible: typeof this._tauxAvancementCible): IndicateurRowBuilder {
    this._tauxAvancementCible = tauxAvancementCible;
    return this;
  }

  avecDateValeurCible(dateValeurCible: typeof this._dateValeurCible): IndicateurRowBuilder {
    this._dateValeurCible = dateValeurCible;
    return this;
  }

  avecTypeId(typeId: typeof this._typeId): IndicateurRowBuilder {
    this._typeId = typeId;
    return this;
  }

  avecTypeNom(typeNom: typeof this._typeNom): IndicateurRowBuilder {
    this._typeNom = typeNom;
    return this;
  }

  avecEstBaromètre(estBaromètre: typeof this._estBaromètre): IndicateurRowBuilder {
    this._estBaromètre = estBaromètre;
    return this;
  }

  avecEstPhare(estPhare: typeof this._estPhare): IndicateurRowBuilder {
    this._estPhare = estPhare;
    return this;
  }

  avecValeurInitiale(valeurInitiale: typeof this._valeurInitiale): IndicateurRowBuilder {
    this._valeurInitiale = valeurInitiale;
    return this;
  }

  avecDateValeurInitiale(dateValeurInitiale: typeof this._dateValeurInitiale): IndicateurRowBuilder {
    this._dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  avecValeurActuelle(valeurActuelle: typeof this._valeurActuelle): IndicateurRowBuilder {
    this._valeurActuelle = valeurActuelle;
    return this;
  }

  avecDateValeurActuelle(dateValeurActuelle: typeof this._dateValeurActuelle): IndicateurRowBuilder {
    this._dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  avecTerritoireNom(territoireNom: typeof this._territoireNom): IndicateurRowBuilder {
    this._territoireNom = territoireNom;
    return this;
  }

  avecCodeInsee(codeInsee: typeof this._codeInsee): IndicateurRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  avecMaille(maille: typeof this._maille): IndicateurRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    return this;
  }

  avecÉvolutionValeurActuelle(évolutionValeurActuelle: typeof this._évolutionValeurActuelle): IndicateurRowBuilder {
    this._évolutionValeurActuelle = évolutionValeurActuelle;
    return this;
  }

  avecÉvolutionDateValeurActuelle(évolutionDateValeurActuelle: typeof this._évolutionDateValeurActuelle): IndicateurRowBuilder {
    this._évolutionDateValeurActuelle = évolutionDateValeurActuelle;
    return this;
  }

  avecDescription(description: typeof this._description): IndicateurRowBuilder {
    this._description = description;
    return this;
  }

  avecSource(source: typeof this._source): IndicateurRowBuilder {
    this._source = source;
    return this;
  }

  avecModeDeCalcul(modeDeCalcul: typeof this._modeDeCalcul): IndicateurRowBuilder {
    this._modeDeCalcul = modeDeCalcul;
    return this;
  }

  build(): indicateur {
    return {
      id: this._id,
      nom: this._nom,
      chantier_id: this._chantierId,
      objectif_valeur_cible: this._valeurCible,
      objectif_taux_avancement: this._tauxAvancementCible,
      objectif_date_valeur_cible: this._dateValeurCible,
      type_id: this._typeId,
      type_nom: this._typeNom,
      est_barometre: this._estBaromètre,
      est_phare: this._estPhare,
      valeur_initiale: this._valeurInitiale,
      date_valeur_initiale: this._dateValeurInitiale,
      valeur_actuelle: this._valeurActuelle,
      date_valeur_actuelle: this._dateValeurActuelle,
      territoire_nom: this._territoireNom,
      code_insee: this._codeInsee,
      maille: this._maille,
      evolution_valeur_actuelle: this._évolutionValeurActuelle,
      evolution_date_valeur_actuelle: this._évolutionDateValeurActuelle,
      description: this._description,
      source: this._source,
      mode_de_calcul: this._modeDeCalcul,
    };
  }
}
