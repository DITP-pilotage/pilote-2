import { chantier } from '@prisma/client';

export default class ChantierRowBuilder {
  private _id: string = 'CH-001';

  private _nom: string = 'Chantier ' + this._id;

  private _axe: string = 'Axe du chantier';

  private _ppg: string = 'Ppg du chantier';

  private _perimetre_ids: string[] = [];

  private _maille: string = 'NAT';

  private _codeInsee: string = 'FR';

  private _tauxAvancement: number = 42;

  private _météo: string | null = 'SOLEIL';

  private _directeurs_administration_centrale: string[] = [];

  private _directions_administration_centrale: string[] = [];

  private _directeurs_projet: string[] = [];

  private _directeurs_projet_mails: string[] = [];

  private _ministeres: string[] = ['Ministère 1'];

  private _estBaromètre: boolean = false;

  withId(id: string): ChantierRowBuilder {
    this._id = id;
    return this;
  }

  withNom(nom: string): ChantierRowBuilder {
    this._nom = nom;
    return this;
  }

  withAxe(axe: string): ChantierRowBuilder {
    this._axe = axe;
    return this;
  }

  withPpg(ppg: string): ChantierRowBuilder {
    this._ppg = ppg;
    return this;
  }

  withPérimètresIds(périmètresIds: string[]): ChantierRowBuilder {
    this._perimetre_ids = périmètresIds;
    return this;
  }

  withMailleNationale(): ChantierRowBuilder {
    this._maille = 'NAT';
    this._codeInsee = 'FR';
    return this;
  }

  withMaille(maille: string): ChantierRowBuilder {
    this._maille = maille;
    return this;
  }

  withCodeInsee(codeInsee: string): ChantierRowBuilder {
    this._codeInsee = codeInsee;
    return this;
  }

  withTauxAvancement(tauxAvancement: number): ChantierRowBuilder {
    this._tauxAvancement = tauxAvancement;
    return this;
  }

  withMétéo(météo: string | null): ChantierRowBuilder {
    this._météo = météo;
    return this;
  }

  withDirecteursAdministrationCentrale(it: string[]): ChantierRowBuilder {
    this._directeurs_administration_centrale = it;
    return this;
  }

  withDirectionsAdministrationCentrale(it: string[]): ChantierRowBuilder {
    this._directions_administration_centrale = it;
    return this;
  }

  withDirecteursProjet(it: string[]): ChantierRowBuilder {
    this._directeurs_projet = it;
    return this;
  }

  withDirecteursProjetMail(it: string[]): ChantierRowBuilder {
    this._directeurs_projet_mails = it;
    return this;
  }

  withMinistères(ministères: string[]): ChantierRowBuilder {
    this._ministeres = ministères;
    return this;
  }

  withEstBaromètre(estBaromètre: boolean): ChantierRowBuilder {
    this._estBaromètre = estBaromètre;
    return this;
  }

  build(): chantier {
    return {
      id: this._id,
      nom: this._nom,
      axe: this._axe,
      ppg: this._ppg,
      perimetre_ids: this._perimetre_ids,
      maille: this._maille,
      code_insee: this._codeInsee,
      taux_avancement: this._tauxAvancement,
      meteo: this._météo,
      directeurs_administration_centrale: this._directeurs_administration_centrale,
      directions_administration_centrale: this._directions_administration_centrale,
      directeurs_projet: this._directeurs_projet,
      directeurs_projet_mails: this._directeurs_projet_mails,
      ministeres: this._ministeres,
      territoire_nom: null,
      est_barometre: this._estBaromètre,
    };
  }
}
