import { chantier } from '@prisma/client';

export default class ChantierRowBuilder {
  private _id: string = 'CH-001';

  private _codeInsee: string = '78';

  private _maille: string = 'NAT';

  private _directeurProjet: string = 'Directeur ' + this._id;

  withId(id: string) {
    this._id = id;
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

  build(): chantier {
    return {
      id: this._id,
      nom: 'Nom ' + this._id,
      maille: this._maille,
      code_insee: this._codeInsee,
      directeur_projet: this._directeurProjet,

      perimetre_ids: [],
      taux_avancement: null,
      territoire_nom: null,
      directeurs_administration_centrale: [],
      ministeres: [],
    };
  }
}
