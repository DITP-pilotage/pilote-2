import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { Utilisateur } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { Profil } from "@/server/domain/profil/Profil.interface";
import { TerritoireRepository } from "@/server/gestion-utilisateur/domain/ports/TerritoireRepository";
import { PerimetreMinisterielRepository } from "@/server/gestion-utilisateur/domain/ports/PerimetreMinisterielRepository";
import { ChantierRepository } from "@/server/gestion-utilisateur/domain/ports/ChantierRepository";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { profilsInfolettreCoordinateur } from "@/server/domain/utilisateur/Utilisateur.interface";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import type { Inject } from "@/server/gestion-utilisateur/module";
import logger from "@/server/infrastructure/Logger";

export default class ReactiverUnUtilisateurUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private chantierRepository: ChantierRepository;

  private territoireRepository: TerritoireRepository;

  private perimetreMinisterielRepository: PerimetreMinisterielRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    chantierRepository,
    territoireRepository,
    perimetreMinisterielRepository,
    utilisateurIAMRepository,
    contactInfoLettresService,
  }: Inject<
    | "utilisateurRepository"
    | "chantierRepository"
    | "territoireRepository"
    | "perimetreMinisterielRepository"
    | "utilisateurIAMRepository"
    | "contactInfoLettresService"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
    this.perimetreMinisterielRepository = perimetreMinisterielRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(
    email: Utilisateur["email"],
    habilitations: Habilitations,
    profilAuteur: Profil | null,
    auteurId: string,
  ): Promise<void> {
    const listeInformationsChantiersUtilisateurs =
      await this.chantierRepository.listerInformationsChantiersUtilisateurs();
    const listeTerritoiresCodes = await this.territoireRepository.listerCodes(
      [],
    );
    const listePerimetresMinisteriels =
      await this.perimetreMinisterielRepository.listerIds([]);

    const utilisateurAReactiver = await this.utilisateurRepository.récupérer(
      email,
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,
    );

    if (!utilisateurAReactiver) {
      throw new NotFoundError("Le compte à supprimer n'existe pas.");
    }

    const habilitation = new Habilitation(habilitations);

    habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
      utilisateurAReactiver.habilitations.lecture.chantiers,
      utilisateurAReactiver.habilitations.lecture.territoires,
      profilAuteur,
    );

    await this.utilisateurRepository.reinitialiserEtatVisualisationVideoAccueil(
      email,
    );

    await this.utilisateurRepository.reactiver(email, auteurId);

    if (process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO === "true") {
      const listesDiffusion = profilsInfolettreCoordinateur.includes(
        utilisateurAReactiver.profil,
      )
        ? [3]
        : [];
      await this.contactInfoLettresService.creerContact(
        utilisateurAReactiver.email,
        utilisateurAReactiver.nom,
        utilisateurAReactiver.prénom,
        utilisateurAReactiver.profil,
        listesDiffusion,
      );
    }

    if (
      process.env.IMPORT_KEYCLOAK_URL &&
      process.env.IMPORT_KEYCLOAK_URL.startsWith("http")
    ) {
      await this.utilisateurIAMRepository.reactive(email);
    }

    logger.info(
      {
        categorie: "utilisateur",
        source: "ReactiverUnUtilisateurUseCase",
        email,
        profil: utilisateurAReactiver.profil,
        auteurId,
      },
      "Réactivation utilisateur",
    );
  }
}
