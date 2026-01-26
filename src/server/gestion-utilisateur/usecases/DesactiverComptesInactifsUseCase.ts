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
    mailsPremiereRelance: number;
    mailsDeuxiemeRelance: number;
  };
}

const TEMPLATE_MAIL_ID = 39;
const NOMBRE_JOUR_ENTRE_RELANCES = 23;
const NOMBRE_JOUR_AVANT_DESACTIVATION_PREMIERE_RELANCE = 30;
const NOMBRE_JOUR_AVANT_DESACTIVATION_DEUXIEME_RELANCE = 7;

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

    const aujourdHui = new Date();
    const comptesInactifs =
      await this.utilisateurRepository.recupererComptesInactifs(aujourdHui);

    logger.info(`${comptesInactifs.length} comptes inactifs trouvés`);

    let comptesDesactives = 0;
    let mailsPremiereRelance = 0;
    let mailsDeuxiemeRelance = 0;

    for (const compte of comptesInactifs) {
      const {
        email,
        datePremiereRelanceDesactivation,
        dateDeuxiemeRelanceDesactivation,
        dateDesactivationProgramee,
      } = compte;

      if (
        dateDesactivationProgramee &&
        dateDesactivationProgramee <= aujourdHui
      ) {
        logger.info(`Désactivation du compte ${email}`);

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
      } else if (!datePremiereRelanceDesactivation) {
        await this.contactInfoLettresService.envoieUnEmail(
          [{ email }],
          TEMPLATE_MAIL_ID,
          {
            joursAvantDesactivation:
              NOMBRE_JOUR_AVANT_DESACTIVATION_PREMIERE_RELANCE,
          },
        );
        await this.utilisateurRepository.mettreAJourDatePremiereRelanceDesactivation(
          email,
          aujourdHui,
        );
        logger.info(`Première relance envoyée à ${email}`);
        mailsPremiereRelance++;
      } else if (!dateDeuxiemeRelanceDesactivation) {
        const dateLimiteDeuxiemeRelance = new Date(
          datePremiereRelanceDesactivation,
        );
        dateLimiteDeuxiemeRelance.setDate(
          dateLimiteDeuxiemeRelance.getDate() + NOMBRE_JOUR_ENTRE_RELANCES,
        );

        if (dateLimiteDeuxiemeRelance <= aujourdHui) {
          await this.contactInfoLettresService.envoieUnEmail(
            [{ email }],
            TEMPLATE_MAIL_ID,
            {
              joursAvantDesactivation:
                NOMBRE_JOUR_AVANT_DESACTIVATION_DEUXIEME_RELANCE,
            },
          );

          const dateDesactivation = new Date(aujourdHui);
          dateDesactivation.setDate(dateDesactivation.getDate() + 7);

          await this.utilisateurRepository.mettreAJourDateDeuxiemeRelanceDesactivation(
            email,
            aujourdHui,
          );
          await this.utilisateurRepository.mettreAJourDateDesactivationProgramee(
            email,
            dateDesactivation,
          );

          logger.info(`Deuxieme relance envoyée à ${email}`);
          mailsDeuxiemeRelance++;
        }
      }
    }

    return {
      comptesTotaux: comptesInactifs.length,
      comptesDesactives,
      detailsMails: {
        mailsPremiereRelance,
        mailsDeuxiemeRelance,
      },
    };
  }
}
