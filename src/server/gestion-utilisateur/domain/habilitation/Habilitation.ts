import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import {
  ChantiersNonAutorisésCreationModificationUtilisateurErreur,
  ChantiersNonAutorisésSuppressionUtilisateurErreur,
  ProfilNonAutorisésSuppressionUtilisateurErreur,
  TerritoiresNonAutorisésCreationModificationUtilisateurErreur,
  TerritoiresNonAutorisésSuppressionUtilisateurErreur,
} from "@/server/utils/errors";
import { toutesLesValeursDuTableauSontContenuesDansLAutreTableau } from "@/client/utils/arrays";
import { Profil } from "@/server/domain/profil/Profil.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { PropositionValeurAvancementChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { Habilitations } from "./Habilitation.interface";

const PROFIL_AUTORISE_A_MODIFICATION_TOKEN_API = new Set([
  ProfilEnum.DITP_ADMIN,
]);
const PROFIL_AUTORISE_A_LECTURE_METADATA_INDICATEUR = new Set([
  ProfilEnum.DITP_ADMIN,
]);
const PROFIL_AUTORISE_A_MODIFICATION_METADATA_INDICATEUR = new Set([
  ProfilEnum.DITP_ADMIN,
]);
const PROFIL_AUTORISE_A_MODIFICATION_GESTION_CONTENU = new Set([
  ProfilEnum.DITP_ADMIN,
]);
const PROFIL_AUTORISE_A_MODIFIER_PROPOSITION_VALEUR_AVANCEMENT = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.PREFET_DEPARTEMENT,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
]);

const PROFIL_AUTORISE_A_ACCEPTER_PROPOSITION_VALEUR_AVANCEMENT = new Set([
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.SECRETARIAT_GENERAL,
]);

export default class Habilitation {
  constructor(private _habilitations: Habilitations) {}

  vérifierLesHabilitationsEnSuppressionUtilisateur(
    chantiersIds: Chantier["id"][],
    territoiresCodes: Territoire["code"][],
    profil: Profil | null,
  ) {
    if (!profil || !profil.utilisateurs.modificationPossible) {
      throw new ProfilNonAutorisésSuppressionUtilisateurErreur();
    }

    if (
      profil.utilisateurs.tousChantiers &&
      !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(
        territoiresCodes,
        this._habilitations.gestionUtilisateur.territoires,
      )
    ) {
      throw new TerritoiresNonAutorisésSuppressionUtilisateurErreur();
    }

    if (
      profil.utilisateurs.tousTerritoires &&
      !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(
        chantiersIds,
        this._habilitations.gestionUtilisateur.chantiers,
      )
    )
      throw new ChantiersNonAutorisésSuppressionUtilisateurErreur();
  }

  vérifierLesHabilitationsEnCréationModificationUtilisateur(
    chantiersIds: Chantier["id"][],
    territoiresCodes: Territoire["code"][],
    profil: Profil | null,
  ) {
    if (!profil || !profil.utilisateurs.modificationPossible) {
      throw new ProfilNonAutorisésSuppressionUtilisateurErreur();
    }
    if (
      profil.utilisateurs.tousChantiers &&
      !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(
        territoiresCodes,
        this._habilitations.gestionUtilisateur.territoires,
      )
    ) {
      throw new TerritoiresNonAutorisésCreationModificationUtilisateurErreur();
    }
    if (
      profil.utilisateurs.tousTerritoires &&
      !toutesLesValeursDuTableauSontContenuesDansLAutreTableau(
        chantiersIds,
        this._habilitations.gestionUtilisateur.chantiers,
      )
    )
      throw new ChantiersNonAutorisésCreationModificationUtilisateurErreur();
  }

  verifierAutorisationModificationTokenAPI(profil: ProfilCode | null) {
    if (!profil || !PROFIL_AUTORISE_A_MODIFICATION_TOKEN_API.has(profil)) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationLectureMetadataIndicateur(profil: ProfilCode | null) {
    if (!profil || !PROFIL_AUTORISE_A_LECTURE_METADATA_INDICATEUR.has(profil)) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationModificationMetadataIndicateur(
    profil: ProfilCode | null,
  ) {
    if (
      !profil ||
      !PROFIL_AUTORISE_A_MODIFICATION_METADATA_INDICATEUR.has(profil)
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationModificationGestionContenu(profil: ProfilCode | null) {
    if (
      !profil ||
      !PROFIL_AUTORISE_A_MODIFICATION_GESTION_CONTENU.has(profil)
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationModificationPropositionValeurAvancement(
    profil: ProfilCode | null,
    chantiersIdsAutorisés: string[],
    propositionValeurAvancementChantierInformation: PropositionValeurAvancementChantierInformation,
  ) {
    if (
      !profil ||
      !PROFIL_AUTORISE_A_MODIFIER_PROPOSITION_VALEUR_AVANCEMENT.has(profil) ||
      propositionValeurAvancementChantierInformation.statut === "ARCHIVE" ||
      !chantiersIdsAutorisés.includes(
        propositionValeurAvancementChantierInformation.id,
      )
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
    profil: ProfilCode | null,
    chantiersIdsAutorisés: string[],
    propositionValeurAvancementChantierInformation: PropositionValeurAvancementChantierInformation,
  ) {
    if (
      !profil ||
      !PROFIL_AUTORISE_A_ACCEPTER_PROPOSITION_VALEUR_AVANCEMENT.has(profil) ||
      propositionValeurAvancementChantierInformation.statut === "ARCHIVE" ||
      !chantiersIdsAutorisés.includes(
        propositionValeurAvancementChantierInformation.id,
      )
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }
}
