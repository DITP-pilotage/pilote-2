import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ActionCompteInactifRepository } from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import logger from "@/server/infrastructure/Logger";
import {
  ActionCompteInactif,
  marquerCommeEchec,
  marquerCommeSucces,
} from "@/server/gestion-utilisateur/domain/ActionCompteInactif";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  actionCompteInactifRepository: ActionCompteInactifRepository;
  contactInfoLettresService: ContactInfoLettresService;
};

export interface EnvoyerLesRelancesResultat {
  premieresRelancesEnvoyees: number;
  deuxiemesRelancesEnvoyees: number;
  erreurs: number;
}

const TEMPLATE_MAIL_ID = 39;
const NOMBRE_JOUR_AVANT_DESACTIVATION_PREMIERE_RELANCE = 30;
const NOMBRE_JOUR_AVANT_DESACTIVATION_DEUXIEME_RELANCE = 7;

export class EnvoyerLesRelancesUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private actionCompteInactifRepository: ActionCompteInactifRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    actionCompteInactifRepository,
    contactInfoLettresService,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.actionCompteInactifRepository = actionCompteInactifRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(): Promise<EnvoyerLesRelancesResultat> {
    const actions =
      await this.actionCompteInactifRepository.recupererActionsParTypeEtStatut(
        ["PREMIERE_RELANCE", "DEUXIEME_RELANCE"],
        "CREEE",
      );

    let premieresRelancesEnvoyees = 0;
    let deuxiemesRelancesEnvoyees = 0;
    let erreurs = 0;

    for (const action of actions) {
      try {
        await this.executerRelance(action);

        const actionSucces = marquerCommeSucces({
          action,
          dateSucces: new Date(),
        });
        await this.actionCompteInactifRepository.sauvegarder(actionSucces);

        if (action.typeAction === "PREMIERE_RELANCE")
          premieresRelancesEnvoyees++;
        if (action.typeAction === "DEUXIEME_RELANCE")
          deuxiemesRelancesEnvoyees++;
      } catch (error) {
        logger.error(
          `Erreur lors de l'envoi de la relance pour ${action.utilisateurId}`,
          error,
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
      premieresRelancesEnvoyees,
      deuxiemesRelancesEnvoyees,
      erreurs,
    };
  }

  private async executerRelance(action: ActionCompteInactif): Promise<void> {
    const email = action.utilisateurId;
    const aujourdHui = new Date();

    if (action.typeAction === "PREMIERE_RELANCE") {
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
    }

    if (action.typeAction === "DEUXIEME_RELANCE") {
      await this.contactInfoLettresService.envoieUnEmail(
        [{ email }],
        TEMPLATE_MAIL_ID,
        {
          joursAvantDesactivation:
            NOMBRE_JOUR_AVANT_DESACTIVATION_DEUXIEME_RELANCE,
        },
      );
      await this.utilisateurRepository.mettreAJourDateDeuxiemeRelanceDesactivation(
        email,
        aujourdHui,
      );

      const dateDesactivation = new Date(aujourdHui);
      dateDesactivation.setDate(dateDesactivation.getDate() + 7);
      await this.utilisateurRepository.mettreAJourDateDesactivationProgramee(
        email,
        dateDesactivation,
      );
    }
  }
}
