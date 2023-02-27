import { indicateur } from '@prisma/client';

export default class IndicateurRowBuilder {
  private _id: string = 'IND-001';

  private _chantierId: string = 'CH-001';

  private _nom: string = 'Indicateur 1';

  private _codeInsee: string = '78';

  private _maille: string = 'NAT';

  private _evolutionValeurActuelle: number[] = [1, 2];

  private _evolutionDateValeurActuelle: string[] = ['2021-06-30', '2022-06-30'];

  private _dateValeurInitiale: string | null = '2020-01-01';

  private _dateValeurActuelle: string | null = '2023-02-01';

  private _valeurInitiale: number | null = 0;

  private _objectifValeurCible: number | null = 0;

  private _objectifTauxAvancement: number | null = 0;

  withId(id: string): IndicateurRowBuilder {
    this._id = id;
    return this;
  }

  withNom(nom: string): IndicateurRowBuilder {
    this._nom = nom;
    return this;
  }

  withChantierId(chantierId: string): IndicateurRowBuilder {
    this._chantierId = chantierId;
    return this;
  }

  withMaille(maille: string): IndicateurRowBuilder {
    this._maille = maille;
    return this;
  }

  withCodeInsee(codeInsee: string): IndicateurRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  withEvolutionValeurActuelle(evolutionValeurActuelle: number[]): IndicateurRowBuilder {
    this._evolutionValeurActuelle = evolutionValeurActuelle;
    return this;
  }

  withEvolutionDateValeurActuelle(evolutionDateValeurActuelle: string[]): IndicateurRowBuilder {
    this._evolutionDateValeurActuelle = evolutionDateValeurActuelle;
    return this;
  }

  withDateValeurInitiale(dateValeurInitiale: string | null): IndicateurRowBuilder {
    this._dateValeurInitiale = dateValeurInitiale;
    return this;
  }

  withValeurInitiale(valeurInitiale: number | null): IndicateurRowBuilder {
    this._valeurInitiale = valeurInitiale;
    return this;
  }

  withDateValeurActuelle(dateValeurActuelle: string | null): IndicateurRowBuilder {
    this._dateValeurActuelle = dateValeurActuelle;
    return this;
  }

  withObjectifValeurCible(objectifValeurCible: number | null): IndicateurRowBuilder {
    this._objectifValeurCible = objectifValeurCible;
    return this;
  }

  withObjectifTauxAvancement(objectifTauxAvancement: number | null): IndicateurRowBuilder {
    this._objectifTauxAvancement = objectifTauxAvancement;
    return this;
  }

  build(): indicateur {
    return {
      id: this._id,
      nom: this._id,
      chantier_id: this._chantierId,
      maille: this._maille,
      code_insee: this._codeInsee,

      objectif_valeur_cible: this._objectifValeurCible,
      objectif_taux_avancement: this._objectifTauxAvancement,
      objectif_date_valeur_cible: null,
      type_id: null,
      type_nom: null,
      est_barometre: null,
      est_phare: null,
      valeur_initiale: this._valeurInitiale,
      date_valeur_initiale: this._dateValeurInitiale !== null ? new Date(this._dateValeurInitiale) : null,
      valeur_actuelle: null,
      date_valeur_actuelle: this._dateValeurActuelle !== null ? new Date(this._dateValeurActuelle) : null,
      territoire_nom: null,
      evolution_valeur_actuelle: this._evolutionValeurActuelle,
      evolution_date_valeur_actuelle: this._evolutionDateValeurActuelle.map(s => new Date(s)),
    };
  }
}
