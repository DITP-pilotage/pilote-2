import { indicateur } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';
import IndicateurBuilder from '@/server/domain/indicateur/Indicateur.builder';
import ChantierBuilder from '@/server/domain/chantier/Chantier.builder';
import DétailsIndicateurBuilder from '@/server/domain/indicateur/DétailsIndicateur.builder';
import {
  générerPeutÊtreNull,
  générerUneMailleAléatoire,
  retourneUneListeDeCodeInseeCohérentePourUneMaille,
} from '@/server/infrastructure/test/builders/utils';

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

  private _territoireCode: indicateur['territoire_code'];

  private _ponderation_dept: indicateur['ponderation_dept'];

  private _ponderation_reg: indicateur['ponderation_reg'];

  private _ponderation_nat: indicateur['ponderation_nat'];


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
    this._dateValeurCible = détailsIndicateurGénéré.dateValeurCible !== null ? new Date(détailsIndicateurGénéré.dateValeurCible) : null;
    this._typeId = indicateurGénéré.type;
    this._typeNom = `nom ${indicateurGénéré.type}`;
    this._estBaromètre = générerPeutÊtreNull(0.2, faker.datatype.boolean());
    this._estPhare = générerPeutÊtreNull(0.2, faker.datatype.boolean());
    this._valeurInitiale = détailsIndicateurGénéré.valeurInitiale;
    this._dateValeurInitiale = détailsIndicateurGénéré.dateValeurInitiale ? new Date(détailsIndicateurGénéré.dateValeurInitiale) : null;
    this._valeurActuelle = détailsIndicateurGénéré.valeurs.length === 0 ? null : détailsIndicateurGénéré.valeurs[détailsIndicateurGénéré.valeurs.length - 1];
    this._dateValeurActuelle = détailsIndicateurGénéré.dateValeurs.length === 0 ? null : new Date(détailsIndicateurGénéré.dateValeurs[détailsIndicateurGénéré.dateValeurs.length - 1]);
    this._territoireNom = générerPeutÊtreNull(0.2, faker.address.state());
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._maille = maille;
    this._évolutionValeurActuelle = détailsIndicateurGénéré.valeurs;
    this._évolutionDateValeurActuelle = détailsIndicateurGénéré.dateValeurs.map(d => new Date(d));
    this._description = indicateurGénéré.description;
    this._source = indicateurGénéré.source;
    this._modeDeCalcul = indicateurGénéré.modeDeCalcul;
    this._territoireCode = `${this._maille}-${this._codeInsee}`;
    this._ponderation_dept = indicateurGénéré.pondération?.nationale ?? null;
    this._ponderation_reg = indicateurGénéré.pondération?.régionale ?? null;
    this._ponderation_nat = indicateurGénéré.pondération?.départementale ?? null;
  }

  avecId(id: indicateur['id']): IndicateurRowBuilder {
    this._id = id;
    return this;
  }

  avecNom(nom: indicateur['nom']): IndicateurRowBuilder {
    this._nom = nom;
    return this;
  }

  avecChantierId(chantierId: indicateur['chantier_id']): IndicateurRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  avecValeurCible(valeurCible: indicateur['objectif_valeur_cible']): IndicateurRowBuilder {
    this._valeurCible = valeurCible;
    return this;
  }

  avecTauxAvancementCible(tauxAvancementCible: indicateur['objectif_taux_avancement']): IndicateurRowBuilder {
    this._tauxAvancementCible = tauxAvancementCible;
    return this;
  }

  avecDateValeurCible(dateValeurCible: indicateur['objectif_date_valeur_cible']): IndicateurRowBuilder {
    this._dateValeurCible = dateValeurCible;
    return this;
  }

  avecTypeId(typeId: indicateur['type_id']): IndicateurRowBuilder {
    this._typeId = typeId;
    return this;
  }

  avecTypeNom(typeNom: indicateur['type_nom']): IndicateurRowBuilder {
    this._typeNom = typeNom;
    return this;
  }

  avecEstBaromètre(estBaromètre: indicateur['est_barometre']): IndicateurRowBuilder {
    this._estBaromètre = estBaromètre;
    return this;
  }

  avecEstPhare(estPhare: indicateur['est_phare']): IndicateurRowBuilder {
    this._estPhare = estPhare;
    return this;
  }

  avecValeurInitiale(valeurInitiale: indicateur['valeur_initiale']): IndicateurRowBuilder {
    this._valeurInitiale = valeurInitiale;
    return this;
  }

  avecDateValeurInitiale(dateValeurInitiale: indicateur['date_valeur_initiale']): IndicateurRowBuilder {
    this._dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  avecValeurActuelle(valeurActuelle: indicateur['valeur_actuelle']): IndicateurRowBuilder {
    this._valeurActuelle = valeurActuelle;
    return this;
  }

  avecDateValeurActuelle(dateValeurActuelle: indicateur['date_valeur_actuelle']): IndicateurRowBuilder {
    this._dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  avecTerritoireNom(territoireNom: indicateur['territoire_nom']): IndicateurRowBuilder {
    this._territoireNom = territoireNom;
    return this;
  }

  avecCodeInsee(codeInsee: indicateur['code_insee']): IndicateurRowBuilder {
    this._codeInsee = codeInsee;
    this._territoireCode = `${this._maille}-${this._codeInsee}`;
    return this;
  }

  avecMaille(maille: indicateur['maille']): IndicateurRowBuilder {
    const codesInsee = retourneUneListeDeCodeInseeCohérentePourUneMaille(maille);
    
    this._maille = maille;
    this._codeInsee = faker.helpers.arrayElement(codesInsee);
    this._territoireCode = `${this._maille}-${this._codeInsee}`;
    return this;
  }

  avecÉvolutionValeurActuelle(évolutionValeurActuelle: indicateur['evolution_valeur_actuelle']): IndicateurRowBuilder {
    this._évolutionValeurActuelle = évolutionValeurActuelle;
    return this;
  }

  avecÉvolutionDateValeurActuelle(évolutionDateValeurActuelle: indicateur['evolution_date_valeur_actuelle']): IndicateurRowBuilder {
    this._évolutionDateValeurActuelle = évolutionDateValeurActuelle;
    return this;
  }

  avecDescription(description: indicateur['description']): IndicateurRowBuilder {
    this._description = description;
    return this;
  }

  avecSource(source: indicateur['source']): IndicateurRowBuilder {
    this._source = source;
    return this;
  }

  avecModeDeCalcul(modeDeCalcul: indicateur['mode_de_calcul']): IndicateurRowBuilder {
    this._modeDeCalcul = modeDeCalcul;
    return this;
  }

  avecTerritoireCode(territoireCode: indicateur['territoire_code']): IndicateurRowBuilder {
    this._territoireCode = territoireCode;
    return this;
  }

  avecPonderationDept(ponderation_dept: indicateur['ponderation_dept']): IndicateurRowBuilder {
    this._ponderation_dept = ponderation_dept;
    return this;
  }

  avecPonderationReg(ponderation_reg: indicateur['ponderation_reg']): IndicateurRowBuilder {
    this._ponderation_reg = ponderation_reg;
    return this;
  }

  avecPonderationNat(ponderation_nat: indicateur['ponderation_nat']): IndicateurRowBuilder {
    this._ponderation_nat = ponderation_nat;
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
      territoire_code: this._territoireCode,
      ponderation_dept: this._ponderation_dept,
      ponderation_reg: this._ponderation_reg,
      ponderation_nat: this._ponderation_nat,
    };
  }
}
