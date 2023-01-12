import { chantier } from '@prisma/client';

export default class ChantierRowBuilder {
  private _id: string = 'CH-001';

  private _nom: string = 'Chantier ' + this._id;

  private _maille: string = 'NAT';

  private _codeInsee: string = 'FR';

  private _tauxAvancement: number = 42;

  private _météo: string = 'SOLEIL';

  withId(id: string) {
    this._id = id;
    return this;
  }

  withNom(nom: string) {
    this._nom = nom;
    return this;
  }

  withMailleNationale() {
    this._maille = 'NAT';
    this._codeInsee = 'FR';
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

  withTauxAvancement(tauxAvancement: number) {
    this._tauxAvancement = tauxAvancement;
    return this;
  }

  withMétéo(météo: string) {
    this._météo = météo;
    return this;
  }

  build(): chantier {
    return {
      id: this._id,
      nom: this._nom,
      maille: this._maille,
      code_insee: this._codeInsee,
      directeurs_projet: ['Directeur ' + this._id],
      perimetre_ids: [],
      taux_avancement: this._tauxAvancement,
      territoire_nom: null,
      directeurs_administration_centrale: [],
      ministeres: [],
      directions_administration_centrale: [],
      meteo: this._météo,
      synthese_des_resultats: 'TBD',
    };
  }
}
