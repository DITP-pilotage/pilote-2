import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import {
  initSuivi,
  saveNewPassword,
} from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface SynchroniserLesSuivisPasswordAdminResultat {
  suivisInitialises: number;
  changementsDetectes: number;
  comptesNonSoumis: number;
  erreurs: number;
}

const PROFIL_SOUMIS = ProfilEnum.DITP_ADMIN;
const SOURCE = "SynchroniserLesSuivisPasswordAdminUseCase";

export class SynchroniserLesSuivisPasswordAdminUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private suiviPasswordAdminRepository: SuiviPasswordAdminRepository;

  private actionPasswordRepository: ActionPasswordRepository;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    suiviPasswordAdminRepository,
    actionPasswordRepository,
  }: Inject<
    | "utilisateurRepository"
    | "utilisateurIAMRepository"
    | "suiviPasswordAdminRepository"
    | "actionPasswordRepository"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.suiviPasswordAdminRepository = suiviPasswordAdminRepository;
    this.actionPasswordRepository = actionPasswordRepository;
  }

  async run(): Promise<SynchroniserLesSuivisPasswordAdminResultat> {
    const aujourdHui = new Date();
    const comptes =
      await this.utilisateurRepository.recupererComptesActifsParProfil(
        PROFIL_SOUMIS,
      );

    const resultat: SynchroniserLesSuivisPasswordAdminResultat = {
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    };

    for (const compte of comptes) {
      try {
        const suivi =
          await this.suiviPasswordAdminRepository.recupererParUtilisateur(
            compte.id,
          );
        const dateDernierChangement =
          await this.utilisateurIAMRepository.recupererDateDernierChangementPassword(
            compte.email,
          );

        if (!dateDernierChangement) {
          if (suivi) {
            logger.warn(
              {
                categorie: "utilisateur",
                source: SOURCE,
                email: compte.email,
              },
              "Compte suivi sans credential mot de passe dans Keycloak, suivi conservé",
            );
          }
          resultat.comptesNonSoumis++;
          continue;
        }

        if (!suivi) {
          await this.suiviPasswordAdminRepository.sauvegarder(
            initSuivi({
              utilisateurId: compte.id,
              dateDernierChangement,
              aujourdHui,
            }),
          );
          resultat.suivisInitialises++;
          continue;
        }

        if (
          suivi.dateDernierChangement.getTime() !==
          dateDernierChangement.getTime()
        ) {
          await this.suiviPasswordAdminRepository.sauvegarder(
            saveNewPassword({ suivi, dateDernierChangement, aujourdHui }),
          );
          await this.actionPasswordRepository.annulerActionsEnAttente(
            compte.id,
          );
          resultat.changementsDetectes++;
        }
      } catch (error) {
        logger.error(
          { categorie: "utilisateur", source: SOURCE, email: compte.email },
          `Erreur de synchronisation du suivi de mot de passe : ${error instanceof Error ? error.message : String(error)}`,
        );
        resultat.erreurs++;
      }
    }

    return resultat;
  }
}
