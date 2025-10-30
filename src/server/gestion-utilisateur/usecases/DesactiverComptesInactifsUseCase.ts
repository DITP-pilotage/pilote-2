import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import logger from "@/server/infrastructure/Logger";
import { configuration } from "@/config";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  contactInfoLettresService: ContactInfoLettresService;
};

export interface DesactiverComptesInactifsResultat {
  comptesTotaux: number;
  comptesDesactives: number;
  detailsMails: {
    mailsJ7: number;
    mailsJ30: number;
  };
}

export class DesactiverComptesInactifsUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private tokenAPIInformationRepository: TokenAPIInformationRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    tokenAPIInformationRepository,
    contactInfoLettresService,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.tokenAPIInformationRepository = tokenAPIInformationRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(): Promise<DesactiverComptesInactifsResultat> {
    const EMAIL_UTILISATEUR_SYSTEME = "import.csv@modernisation.gouv.fr";
    const config = configuration();

    const auteurIdSysteme =
      await this.utilisateurRepository.recupererUtilisateurId(
        EMAIL_UTILISATEUR_SYSTEME,
      );

    if (!auteurIdSysteme) {
      throw new Error(
        `L'utilisateur système n'existe pas. Veuillez créer cet utilisateur avant d'exécuter ce script.`,
      );
    }

    const comptesInactifs =
      await this.utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak();

    logger.info(`${comptesInactifs.length} comptes inactifs trouvés`);

    let comptesDesactives = 0;
    let mailsJ7 = 0;
    let mailsJ30 = 0;

    for (const compte of comptesInactifs) {
      const { email, joursInactivite } = compte;

      if (joursInactivite > 90) {
        logger.info(
          `Désactivation du compte ${email} (${joursInactivite} jours d'inactivité)`,
        );

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

        comptesDesactives++;
      } else if (joursInactivite === 83) {
        await this.contactInfoLettresService.envoieUnEmail([{ email }], 39, {
          joursAvantDesactivation: 7,
        });
        logger.info(`Mail J-7 envoyé à ${email}`);
        mailsJ7++;
      } else if (joursInactivite === 60) {
        await this.contactInfoLettresService.envoieUnEmail([{ email }], 39, {
          joursAvantDesactivation: 30,
        });
        logger.info(`Mail J-30 envoyé à ${email}`);
        mailsJ30++;
      }
    }

    return {
      comptesTotaux: comptesInactifs.length,
      comptesDesactives,
      detailsMails: {
        mailsJ7,
        mailsJ30,
      },
    };
  }
}
