import { $Enums } from "@prisma/client";
import { DateTime } from "luxon";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import {
  ActionPassword,
  marquerCommeEchec,
  marquerCommeSucces,
} from "@/server/gestion-utilisateur/domain/ActionPassword";
import {
  determinerTypeAction,
  SuiviPasswordAdmin,
} from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { configuration } from "@/config";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface ExecuterLesActionsPasswordResultat {
  premieresRelancesEnvoyees: number;
  deuxiemesRelancesEnvoyees: number;
  expirationsForcees: number;
  erreurs: number;
}

const ERREUR_ACTION_OBSOLETE =
  "Action obsolète : le suivi du mot de passe ne la justifie plus";

const JOURS_AVANT_EXPIRATION: Record<$Enums.type_action_password, number> = {
  PREMIERE_RELANCE: 30,
  DEUXIEME_RELANCE: 7,
  EXPIRATION: 0,
};

const ORDRE_EXECUTION: $Enums.type_action_password[] = [
  "EXPIRATION",
  "DEUXIEME_RELANCE",
  "PREMIERE_RELANCE",
];

const SOURCE = "ExecuterLesActionsPasswordUseCase";

export class ExecuterLesActionsPasswordUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private suiviPasswordAdminRepository: SuiviPasswordAdminRepository;

  private actionPasswordRepository: ActionPasswordRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    suiviPasswordAdminRepository,
    actionPasswordRepository,
    contactInfoLettresService,
  }: Inject<
    | "utilisateurRepository"
    | "utilisateurIAMRepository"
    | "suiviPasswordAdminRepository"
    | "actionPasswordRepository"
    | "contactInfoLettresService"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.suiviPasswordAdminRepository = suiviPasswordAdminRepository;
    this.actionPasswordRepository = actionPasswordRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(): Promise<ExecuterLesActionsPasswordResultat> {
    // Fail-fast : forcer un mot de passe sans pouvoir prévenir l'utilisateur
    // serait pire que ne rien faire.
    const templateId = configuration().brevo.templateExpirationPasswordId;
    if (!templateId) {
      throw new Error(
        "Template Brevo d'expiration du mot de passe non configuré (BREVO_TEMPLATE_EXPIRATION_PASSWORD_ID)",
      );
    }

    const actions =
      await this.actionPasswordRepository.recupererActionsParTypeEtStatut({
        typesAction: ORDRE_EXECUTION,
        statut: "CREEE",
      });
    const actionsOrdonnees = [...actions].sort(
      (premiere, seconde) =>
        ORDRE_EXECUTION.indexOf(premiere.typeAction) -
        ORDRE_EXECUTION.indexOf(seconde.typeAction),
    );

    const resultat: ExecuterLesActionsPasswordResultat = {
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    };

    for (const action of actionsOrdonnees) {
      try {
        const issue = await this.executerAction(action, templateId);

        if (issue === "OBSOLETE") {
          await this.actionPasswordRepository.sauvegarder(
            marquerCommeEchec({
              action,
              dateTentative: new Date(),
              erreur: ERREUR_ACTION_OBSOLETE,
            }),
          );
          continue;
        }

        await this.actionPasswordRepository.sauvegarder(
          marquerCommeSucces({ action, dateSucces: new Date() }),
        );

        if (action.typeAction === "PREMIERE_RELANCE")
          resultat.premieresRelancesEnvoyees++;
        if (action.typeAction === "DEUXIEME_RELANCE")
          resultat.deuxiemesRelancesEnvoyees++;
        if (action.typeAction === "EXPIRATION") resultat.expirationsForcees++;
      } catch (error) {
        const messageErreur =
          error instanceof Error ? error.message : String(error);
        logger.error(
          {
            categorie: "utilisateur",
            source: SOURCE,
            utilisateurId: action.utilisateurId,
            typeAction: action.typeAction,
          },
          `Erreur exécution action mot de passe : ${messageErreur}`,
        );
        await this.actionPasswordRepository.sauvegarder(
          marquerCommeEchec({
            action,
            dateTentative: new Date(),
            erreur: messageErreur,
          }),
        );
        resultat.erreurs++;
      }
    }

    return resultat;
  }

  /**
   * Garde d'obsolescence : l'action a été créée par la phase 2 à partir d'un
   * état du suivi qui a pu changer depuis (mot de passe changé entre-temps,
   * relance déjà posée par un passage précédent interrompu). On ne l'exécute
   * que si le domaine la déterminerait encore aujourd'hui.
   */
  private async executerAction(
    action: ActionPassword,
    templateId: number,
  ): Promise<"EXECUTEE" | "OBSOLETE"> {
    const maintenant = new Date();

    const estActif = await this.utilisateurRepository.estActif(
      action.utilisateurId,
    );
    if (!estActif) {
      throw new Error("Compte désactivé");
    }

    const email = await this.utilisateurRepository.recupererUtilisateurEmail(
      action.utilisateurId,
    );
    if (!email) {
      throw new Error("Utilisateur introuvable");
    }

    const suivi =
      await this.suiviPasswordAdminRepository.recupererParUtilisateur(
        action.utilisateurId,
      );
    if (!suivi) {
      throw new Error("Suivi de mot de passe introuvable");
    }

    if (
      determinerTypeAction({ suivi, aujourdHui: maintenant }) !==
      action.typeAction
    ) {
      return "OBSOLETE";
    }

    if (action.typeAction === "EXPIRATION") {
      await this.utilisateurIAMRepository.forcerChangementPassword(email);
    }

    await this.contactInfoLettresService.envoieUnEmail(
      [{ email }],
      templateId,
      {
        joursAvantExpiration: JOURS_AVANT_EXPIRATION[action.typeAction],
        dateExpiration: DateTime.fromJSDate(suivi.dateExpiration)
          .setZone("Europe/Paris")
          .toFormat("dd/MM/yyyy"),
      },
    );

    await this.suiviPasswordAdminRepository.sauvegarder(
      this.poserDate(suivi, action.typeAction, maintenant),
    );

    return "EXECUTEE";
  }

  private poserDate(
    suivi: SuiviPasswordAdmin,
    typeAction: $Enums.type_action_password,
    date: Date,
  ): SuiviPasswordAdmin {
    switch (typeAction) {
      case "PREMIERE_RELANCE":
        return { ...suivi, datePremiereRelance: date };
      case "DEUXIEME_RELANCE":
        return { ...suivi, dateDeuxiemeRelance: date };
      case "EXPIRATION":
        return { ...suivi, dateExpirationForcee: date };
    }
  }
}
