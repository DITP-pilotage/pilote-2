import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ActionCompteInactifRepository } from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import logger from "@/server/infrastructure/Logger";
import { configuration } from "@/config";
import {
  marquerCommeEchec,
  marquerCommeSucces,
} from "@/server/gestion-utilisateur/domain/ActionCompteInactif";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface DesactiverLesComptesInactifsResultat {
  comptesDesactives: number;
  erreurs: number;
}

const EMAIL_UTILISATEUR_SYSTEME = "import.csv@modernisation.gouv.fr";

export class DesactiverLesComptesInactifsUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private actionCompteInactifRepository: ActionCompteInactifRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private tokenAPIInformationRepository: TokenAPIInformationRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    actionCompteInactifRepository,
    utilisateurIAMRepository,
    tokenAPIInformationRepository,
    contactInfoLettresService,
  }: Inject<
    | "utilisateurRepository"
    | "actionCompteInactifRepository"
    | "utilisateurIAMRepository"
    | "tokenAPIInformationRepository"
    | "contactInfoLettresService"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.actionCompteInactifRepository = actionCompteInactifRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(): Promise<DesactiverLesComptesInactifsResultat> {
    const config = configuration();

    const auteurIdSysteme =
      await this.utilisateurRepository.recupererUtilisateurId(
        EMAIL_UTILISATEUR_SYSTEME,
      );

    if (!auteurIdSysteme) {
      throw new Error(
        "L'utilisateur système n'existe pas. Veuillez créer cet utilisateur avant d'exécuter ce script.",
      );
    }

    const actions =
      await this.actionCompteInactifRepository.recupererActionsParTypeEtStatut({
        typesAction: ["DESACTIVATION"],
        statut: "CREEE",
      });

    let comptesDesactives = 0;
    let erreurs = 0;

    for (const action of actions) {
      const email = action.utilisateurId;

      try {
        await this.utilisateurRepository.desactiver(email, auteurIdSysteme);

        if (config.featureFlip.lienContactBrevo) {
          await this.contactInfoLettresService.supprimerContact(email);
        }

        if (config.import.keycloakUrl) {
          await this.utilisateurIAMRepository.desactive(email);
        }

        await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({
          email,
        });

        const actionSucces = marquerCommeSucces({
          action,
          dateSucces: new Date(),
        });
        await this.actionCompteInactifRepository.sauvegarder(actionSucces);

        comptesDesactives++;
      } catch (error) {
        logger.error(
          {
            categorie: "utilisateur",
            source: "DesactiverLesComptesInactifsUseCase",
            email,
          },
          `Erreur lors de la désactivation du compte : ${error instanceof Error ? error.message : String(error)}`,
        );

        const actionEchec = marquerCommeEchec({
          action,
          dateTentative: new Date(),
          erreur: error instanceof Error ? error.message : String(error),
        });
        await this.actionCompteInactifRepository.sauvegarder(actionEchec);

        erreurs++;
      }
    }

    return {
      comptesDesactives,
      erreurs,
    };
  }
}
