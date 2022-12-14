import { indicateur } from '@prisma/client';

export default class IndicateurRowBuilder {
  private _id: string = 'IND-001';

  private _chantierId: string = 'CH-001';

  private _nom: string = 'Indicateur 1';

  private _codeInsee: string = '78';

  private _maille: string = 'NAT';

  withId(id: string) {
    this._id = id;
    return this;
  }

  withNom(nom: string) {
    this._nom = nom;
    return this;
  }

  withChantierId(chantierId: string) {
    this._chantierId = chantierId;
    return this;
  }

  withMaille(maille: string) {
    this._maille = maille;
    return this;
  }

  withCodeInsee(codeInsee: string) {
    this._codeInsee = codeInsee;
    return this;
  }

  build(): indicateur {
    return {
      id: this._id,
      nom: this._id,
      chantier_id: this._chantierId,
      maille: this._maille,
      code_insee: this._codeInsee,

      objectif_valeur_cible: null,
      objectif_taux_avancement: null,
      objectif_date_valeur_cible: null,
      type_id: null,
      type_nom: null,
      est_barometre: null,
      est_phare: null,
      valeur_initiale: null,
      date_valeur_initiale: null,
      valeur_actuelle: null,
      date_valeur_actuelle: null,
      territoire_nom: null,
    };
  }
}
