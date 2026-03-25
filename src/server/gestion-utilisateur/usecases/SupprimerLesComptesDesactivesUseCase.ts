import logger from "@/server/infrastructure/Logger";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { CommentaireRepository } from "@/server/gestion-utilisateur/domain/ports/CommentaireRepository";
import { SyntheseDesResultatsRepository } from "@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository";
import { DecisionStrategiqueRepository } from "@/server/gestion-utilisateur/domain/ports/DecisionStrategiqueRepository";
import { ObjectifRepository } from "@/server/gestion-utilisateur/domain/ports/ObjectifRepository";
import { RapportRepository } from "@/server/gestion-utilisateur/domain/ports/RapportRepository";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/gestion-utilisateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";
import type { Inject } from "@/server/gestion-utilisateur/module";

export const EMAIL_AUTEUR_REMPLACEMENT =
  "utilisateur.supprime@modernisation.gouv.fr";
const NOMBRE_ANNEE_AVANT_SUPPRESSION = 2;

export interface ResultatSuppression {
  supprimes: { id: string; email: string }[];
  erreurs: { id: string; email: string; erreur: string }[];
}

export class SupprimerLesComptesDesactivesUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private commentaireRepository: CommentaireRepository;

  private syntheseDesResultatsRepository: SyntheseDesResultatsRepository;

  private decisionStrategiqueRepository: DecisionStrategiqueRepository;

  private objectifRepository: ObjectifRepository;

  private rapportRepository: RapportRepository;

  private indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private historisationModification: HistorisationModificationRepository;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    commentaireRepository,
    syntheseDesResultatsRepository,
    decisionStrategiqueRepository,
    objectifRepository,
    rapportRepository,
    indicateurTerritoireValeurEvenementRepository,
    historisationModification,
  }: Inject<
    | "utilisateurRepository"
    | "utilisateurIAMRepository"
    | "commentaireRepository"
    | "syntheseDesResultatsRepository"
    | "decisionStrategiqueRepository"
    | "objectifRepository"
    | "rapportRepository"
    | "indicateurTerritoireValeurEvenementRepository"
    | "historisationModification"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.commentaireRepository = commentaireRepository;
    this.syntheseDesResultatsRepository = syntheseDesResultatsRepository;
    this.decisionStrategiqueRepository = decisionStrategiqueRepository;
    this.objectifRepository = objectifRepository;
    this.rapportRepository = rapportRepository;
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.historisationModification = historisationModification;
  }

  async run(): Promise<ResultatSuppression> {
    const dateDesactivationMax = new Date();
    dateDesactivationMax.setFullYear(
      dateDesactivationMax.getFullYear() - NOMBRE_ANNEE_AVANT_SUPPRESSION,
    );
    const utilisateursASupprimer =
      await this.utilisateurRepository.recupererComptesDesactives(
        dateDesactivationMax,
      );
    logger.info(`${utilisateursASupprimer.length} utilisateurs à supprimer`);

    const supprimes: ResultatSuppression["supprimes"] = [];
    const erreurs: ResultatSuppression["erreurs"] = [];

    for (const utilisateur of utilisateursASupprimer) {
      try {
        await Promise.all([
          this.commentaireRepository.anonymiserAuteurs(
            [utilisateur.id],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
          this.syntheseDesResultatsRepository.anonymiserAuteurs(
            [utilisateur.id],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
          this.decisionStrategiqueRepository.anonymiserAuteurs(
            [utilisateur.id],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
          this.objectifRepository.anonymiserAuteurs(
            [utilisateur.id],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
          this.indicateurTerritoireValeurEvenementRepository.anonymiserAuteurs(
            [utilisateur.id],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
          this.historisationModification.anonymiserAuteurs(
            [utilisateur.id],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
          this.rapportRepository.anonymiserAuteurs(
            [utilisateur.email],
            EMAIL_AUTEUR_REMPLACEMENT,
          ),
        ]);

        await this.utilisateurRepository.anonymiserAuteurs(
          [utilisateur.id],
          EMAIL_AUTEUR_REMPLACEMENT,
        );
        await this.utilisateurRepository.supprimerListeUtilisateur([
          utilisateur.id,
        ]);
        await this.utilisateurIAMRepository.supprime(utilisateur.email);

        supprimes.push(utilisateur);
      } catch (error) {
        logger.error(
          `Erreur lors de la suppression du compte ${utilisateur.email}`,
          error,
        );
        erreurs.push({
          ...utilisateur,
          erreur: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { supprimes, erreurs };
  }
}
