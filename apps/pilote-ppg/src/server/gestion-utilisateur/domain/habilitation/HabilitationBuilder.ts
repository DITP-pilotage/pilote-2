import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export class HabilitationBuilder {
  private readonly _habilitations: Habilitations;

  private _profil: ProfilCode = ProfilEnum.DITP_ADMIN;

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

  avecTerritoireCodesGestionUtilisateur(territoireCodes: string[]) {
    this._habilitations.gestionUtilisateur.territoires = territoireCodes;
    return this;
  }

  avecChantiersIdsGestionUtilisateur(chantiersIds: string[]) {
    this._habilitations.gestionUtilisateur.chantiers = chantiersIds;
    return this;
  }

  avecChantiersIdsSaisieIndicateur(chantiersIds: string[]) {
    this._habilitations.saisieIndicateur.chantiers = chantiersIds;
    return this;
  }

  avecChantiersIdsSaisieCommentaire(chantiersIds: string[]) {
    this._habilitations.saisieCommentaire.chantiers = chantiersIds;
    return this;
  }

  avecProfilCode(profilCode: ProfilCode) {
    this._profil = profilCode;
    return this;
  }

  build(): Habilitation {
    return new Habilitation({
      habilitations: this._habilitations,
      profil: this._profil,
    });
  }
}
