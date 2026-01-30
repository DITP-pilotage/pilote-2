import { $Enums } from "@prisma/client";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ActionCompteInactifRepository } from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import logger from "@/server/infrastructure/Logger";
import { creerActionCompteInactif } from "@/server/gestion-utilisateur/domain/ActionCompteInactif";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  actionCompteInactifRepository: ActionCompteInactifRepository;
};

export interface CreerLesActionsComptesInactifsResultat {
  actionsPremiereRelance: number;
  actionsDeuxiemeRelance: number;
  actionsDesactivation: number;
}

const NOMBRE_JOUR_ENTRE_RELANCES = 23;

export class CreerLesActionsComptesInactifsUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private actionCompteInactifRepository: ActionCompteInactifRepository;

  constructor({
    utilisateurRepository,
    actionCompteInactifRepository,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.actionCompteInactifRepository = actionCompteInactifRepository;
  }

  async run(): Promise<CreerLesActionsComptesInactifsResultat> {
    const aujourdHui = new Date();
    const comptesInactifs =
      await this.utilisateurRepository.recupererComptesInactifs(aujourdHui);

    let actionsPremiereRelance = 0;
    let actionsDeuxiemeRelance = 0;
    let actionsDesactivation = 0;

    for (const compte of comptesInactifs) {
      const typeAction = this.determinerTypeAction(compte, aujourdHui);

      if (!typeAction) {
        continue;
      }

      try {
        const action = creerActionCompteInactif({
          utilisateurId: compte.email,
          dateCreation: aujourdHui,
          typeAction,
        });
        await this.actionCompteInactifRepository.sauvegarder(action);

        if (typeAction === "PREMIERE_RELANCE") actionsPremiereRelance++;
        if (typeAction === "DEUXIEME_RELANCE") actionsDeuxiemeRelance++;
        if (typeAction === "DESACTIVATION") actionsDesactivation++;
      } catch (error) {
        logger.error(
          `Erreur lors de la création de l'action ${typeAction} pour ${compte.email}`,
          error,
        );
      }
    }

    return {
      actionsPremiereRelance,
      actionsDeuxiemeRelance,
      actionsDesactivation,
    };
  }

  private determinerTypeAction(
    compte: {
      datePremiereRelanceDesactivation: Date | null;
      dateDeuxiemeRelanceDesactivation: Date | null;
      dateDesactivationProgramee: Date | null;
    },
    aujourdHui: Date,
  ): $Enums.type_action_compte_inactif | null {
    if (
      compte.dateDesactivationProgramee &&
      compte.dateDesactivationProgramee <= aujourdHui
    ) {
      return "DESACTIVATION";
    }

    if (!compte.datePremiereRelanceDesactivation) {
      return "PREMIERE_RELANCE";
    }

    if (!compte.dateDeuxiemeRelanceDesactivation) {
      const dateLimiteDeuxiemeRelance = new Date(
        compte.datePremiereRelanceDesactivation,
      );
      dateLimiteDeuxiemeRelance.setDate(
        dateLimiteDeuxiemeRelance.getDate() + NOMBRE_JOUR_ENTRE_RELANCES,
      );

      if (dateLimiteDeuxiemeRelance <= aujourdHui) {
        return "DEUXIEME_RELANCE";
      }
    }

    return null;
  }
}
