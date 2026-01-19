import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { LISTE_PROFIL_TERRITORIALISE } from "@/server/app/domain/ProfilTerritorialise";
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
  ...LISTE_PROFIL_TERRITORIALISE,
]);

export default class Habilitation {
  constructor(
    private readonly dependencies: {
      habilitations: Habilitations;
      profil: ProfilCode;
    },
  ) {}

  verifierAutorisationModificationTokenAPI() {
    if (
      !PROFIL_AUTORISE_A_MODIFICATION_TOKEN_API.has(this.dependencies.profil)
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationLectureMetadataIndicateur() {
    if (
      !PROFIL_AUTORISE_A_LECTURE_METADATA_INDICATEUR.has(
        this.dependencies.profil,
      )
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationModificationMetadataIndicateur() {
    if (
      !PROFIL_AUTORISE_A_MODIFICATION_METADATA_INDICATEUR.has(
        this.dependencies.profil,
      )
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationModificationGestionContenu() {
    if (
      !PROFIL_AUTORISE_A_MODIFICATION_GESTION_CONTENU.has(
        this.dependencies.profil,
      )
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationModificationPropositionValeurAvancement(
    propositionValeurAvancementChantierInformation: RapportDirecteurProjetChantierInformation,
  ) {
    const estAutoriseAModifierLesCommentaires =
      this.dependencies.habilitations.saisieCommentaire.chantiers.includes(
        propositionValeurAvancementChantierInformation.id,
      );
    if (
      !PROFIL_AUTORISE_A_MODIFIER_PROPOSITION_VALEUR_AVANCEMENT.has(
        this.dependencies.profil,
      ) ||
      propositionValeurAvancementChantierInformation.statut === "ARCHIVE" ||
      !estAutoriseAModifierLesCommentaires
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
    propositionValeurAvancementChantierInformation: RapportDirecteurProjetChantierInformation,
  ) {
    const estAutoriseAImportSurLeChantier =
      this.dependencies.habilitations.saisieIndicateur.chantiers.includes(
        propositionValeurAvancementChantierInformation.id,
      );
    if (
      this.dependencies.profil === ProfilEnum.DITP_ADMIN ||
      propositionValeurAvancementChantierInformation.statut === "ARCHIVE" ||
      !estAutoriseAImportSurLeChantier
    ) {
      throw new UnauthorizedError(
        "Vous n'êtes pas autorisé a effectuer cette action",
      );
    }
  }

  estAutoriseAAccederALaPageAdmin() {
    return this.dependencies.profil === ProfilEnum.DITP_ADMIN;
  }
}
