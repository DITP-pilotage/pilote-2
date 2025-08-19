import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

export class HabilitationBuilder {
  private readonly _habilitations: Habilitations;

  constructor() {
    this._habilitations = {
      lecture: {
        __meta: {
          aAccesTousLesChantiers: false,
          aAccesTousLesTerritoires: false,
          aAccesTousLesPerimetres: false,
        },
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      saisieCommentaire: {
        __meta: {
          aAccesTousLesChantiers: false,
          aAccesTousLesTerritoires: false,
          aAccesTousLesPerimetres: false,
        },
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      saisieIndicateur: {
        __meta: {
          aAccesTousLesChantiers: false,
          aAccesTousLesTerritoires: false,
          aAccesTousLesPerimetres: false,
        },
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      gestionUtilisateur: {
        __meta: {
          aAccesTousLesChantiers: false,
          aAccesTousLesTerritoires: false,
          aAccesTousLesPerimetres: false,
        },
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
      responsabilite: {
        __meta: {
          aAccesTousLesChantiers: false,
          aAccesTousLesTerritoires: false,
          aAccesTousLesPerimetres: false,
        },
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
    };
  }

  avecTerritoireCodesLecture(territoireCodes: string[]) {
    this._habilitations.lecture.territoires = territoireCodes;
    return this;
  }

  avecTerritoireCodesGestionUtilisateur(territoireCodes: string[]) {
    this._habilitations.gestionUtilisateur.territoires = territoireCodes;
    return this;
  }

  avecChantiersIdsGestionUtilisateur(chantiersIds: string[]) {
    this._habilitations.gestionUtilisateur.chantiers = chantiersIds;
    return this;
  }

  avecChantiersIdsLecture(chantiersIds: string[]) {
    this._habilitations.lecture.chantiers = chantiersIds;
    return this;
  }

  avecChantiersIdsSaisieIndicateur(chantiersIds: string[]) {
    this._habilitations.saisieIndicateur.chantiers = chantiersIds;
    return this;
  }

  avecTerritoireCodesSaisieIndicateur(territoireCodes: string[]) {
    this._habilitations.saisieIndicateur.territoires = territoireCodes;
    return this;
  }

  avecChantiersIdsSaisieCommentaire(chantiersIds: string[]) {
    this._habilitations.saisieCommentaire.chantiers = chantiersIds;
    return this;
  }

  build(): Habilitation {
    return new Habilitation({
      habilitations: this._habilitations,
    });
  }
}
