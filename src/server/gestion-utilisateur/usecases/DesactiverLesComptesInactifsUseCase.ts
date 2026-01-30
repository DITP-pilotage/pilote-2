import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ActionCompteInactifRepository } from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import logger from "@/server/infrastructure/Logger";
import { configuration } from "@/config";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  actionCompteInactifRepository: ActionCompteInactifRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  contactInfoLettresService: ContactInfoLettresService;
};

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
  }: Dependencies) {
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
      await this.actionCompteInactifRepository.recupererActionsParTypeEtStatut(
        ["DESACTIVATION"],
        "CREEE",
      );

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

        await this.actionCompteInactifRepository.sauvegarder({
          ...action,
          statut: "SUCCES",
          dateSucces: new Date(),
        });

        comptesDesactives++;
      } catch (error) {
        logger.error(
          `Erreur lors de la désactivation du compte ${email}`,
          error,
        );

        await this.actionCompteInactifRepository.sauvegarder({
          ...action,
          statut: "ERREUR",
          nombreTentatives: action.nombreTentatives + 1,
          dateDerniereTentative: new Date(),
          erreur: error instanceof Error ? error.message : String(error),
        });

        erreurs++;
      }
    }

    return {
      comptesDesactives,
      erreurs,
    };
  }
}
