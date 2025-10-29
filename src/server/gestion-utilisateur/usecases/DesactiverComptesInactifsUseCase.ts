import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import logger from "@/server/infrastructure/Logger";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  tokenAPIInformationRepository: TokenAPIInformationRepository;
  contactInfoLettresService: ContactInfoLettresService;
};

export interface DesactiverComptesInactifsResultat {
  comptesTotaux: number;
  comptesDesactives: number;
  mailsEnvoyes: number;
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

    // Récupérer l'ID de l'utilisateur système
    const auteurIdSysteme =
      await this.utilisateurRepository.recupererUtilisateurId(
        EMAIL_UTILISATEUR_SYSTEME,
      );

    if (!auteurIdSysteme) {
      throw new Error(
        `L'utilisateur système n'existe pas. Veuillez créer cet utilisateur avant d'exécuter ce script.`,
      );
    }

    // Récupérer les comptes inactifs depuis Keycloak
    const comptesInactifs =
      await this.utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak();

    logger.info(`${comptesInactifs.length} comptes inactifs trouvés`);

    let comptesDesactives = 0;
    let mailsJ7 = 0;
    let mailsJ30 = 0;

    // Parcourir les comptes inactifs et appliquer la logique
    for (const compte of comptesInactifs) {
      const { email, joursInactivite } = compte;

      if (joursInactivite > 100) {
        logger.info(
          `Désactivation du compte ${email} (${joursInactivite} jours d'inactivité)`,
        );

        // 1. Désactivation dans la base de données
        await this.utilisateurRepository.desactiver(email, auteurIdSysteme);

        // 2. Suppression du contact Brevo (si feature flag actif)
        if (process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO === "true") {
          await this.contactInfoLettresService.supprimerContact(email);
        }

        // 3. Désactivation dans Keycloak (si configuré)
        if (process.env.IMPORT_KEYCLOAK_URL) {
          await this.utilisateurIAMRepository.desactive(email);
        }

        // 4. Suppression du token API
        await this.tokenAPIInformationRepository.supprimerTokenAPIInformation({
          email,
        });

        comptesDesactives++;
      } else if (joursInactivite === 96) {
        await this.contactInfoLettresService.envoieUnEmail([{ email }], 39, {
          joursAvantDesactivation: 7,
        });
        logger.info(`Mail J-7 envoyé à ${email}`);
        mailsJ7++;
      } else if (joursInactivite === 92) {
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
      mailsEnvoyes: mailsJ7 + mailsJ30,
      detailsMails: {
        mailsJ7,
        mailsJ30,
      },
    };
  }
}
