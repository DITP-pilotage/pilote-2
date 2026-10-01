import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { determinerTypeAction } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { creerActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface CreerLesActionsPasswordResultat {
  actionsPremiereRelance: number;
  actionsDeuxiemeRelance: number;
  actionsExpiration: number;
}

const PROFIL_SOUMIS = ProfilEnum.DITP_ADMIN;
const SOURCE = "CreerLesActionsPasswordUseCase";

export class CreerLesActionsPasswordUseCase {
  private suiviPasswordAdminRepository: SuiviPasswordAdminRepository;

  private actionPasswordRepository: ActionPasswordRepository;

  constructor({
    suiviPasswordAdminRepository,
    actionPasswordRepository,
  }: Inject<"suiviPasswordAdminRepository" | "actionPasswordRepository">) {
    this.suiviPasswordAdminRepository = suiviPasswordAdminRepository;
    this.actionPasswordRepository = actionPasswordRepository;
  }

  async run(): Promise<CreerLesActionsPasswordResultat> {
    const aujourdHui = new Date();
    const suivis =
      await this.suiviPasswordAdminRepository.recupererDesComptesActifsParProfil(
        PROFIL_SOUMIS,
      );
    const actionsEnAttente =
      await this.actionPasswordRepository.recupererActionsParTypeEtStatut({
        typesAction: ["PREMIERE_RELANCE", "DEUXIEME_RELANCE", "EXPIRATION"],
        statut: "CREEE",
      });

    const resultat: CreerLesActionsPasswordResultat = {
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    };

    for (const suivi of suivis) {
      const typeAction = determinerTypeAction({ suivi, aujourdHui });

      if (!typeAction) {
        continue;
      }

      const dejaEnAttente = actionsEnAttente.some(
        (action) =>
          action.utilisateurId === suivi.utilisateurId &&
          action.typeAction === typeAction,
      );
      if (dejaEnAttente) {
        continue;
      }

      try {
        await this.actionPasswordRepository.sauvegarder(
          creerActionPassword({
            utilisateurId: suivi.utilisateurId,
            dateCreation: aujourdHui,
            typeAction,
          }),
        );

        if (typeAction === "PREMIERE_RELANCE")
          resultat.actionsPremiereRelance++;
        if (typeAction === "DEUXIEME_RELANCE")
          resultat.actionsDeuxiemeRelance++;
        if (typeAction === "EXPIRATION") resultat.actionsExpiration++;
      } catch (error) {
        logger.error(
          {
            categorie: "utilisateur",
            source: SOURCE,
            utilisateurId: suivi.utilisateurId,
            typeAction,
          },
          `Erreur création action : ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return resultat;
  }
}
