import logger from "@/server/infrastructure/Logger";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { CommentaireRepository } from "@/server/gestion-utilisateur/domain/ports/CommentaireRepository";
import { SyntheseDesResultatsRepository } from "@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository";
import { DecisionStrategiqueRepository } from "@/server/gestion-utilisateur/domain/ports/DecisionStrategiqueRepository";
import { ObjectifRepository } from "@/server/gestion-utilisateur/domain/ports/ObjectifRepository";
import { RapportRepository } from "@/server/gestion-utilisateur/domain/ports/RapportRepository";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { PropositionValeurAvancementRepository } from "@/server/gestion-utilisateur/domain/ports/PropositionValeurAvancementRepository";
import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";

type Dependencies = {
  utilisateurRepository: UtilisateurRepository;
  utilisateurIAMRepository: UtilisateurIAMRepository;
  commentaireRepository: CommentaireRepository;
  syntheseDesResultatsRepository: SyntheseDesResultatsRepository;
  decisionStrategiqueRepository: DecisionStrategiqueRepository;
  objectifRepository: ObjectifRepository;
  rapportRepository: RapportRepository;
  propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  historisationModification: HistorisationModificationRepository;
};

export const EMAIL_AUTEUR_REMPLACEMENT =
  "utilisateur.supprime@modernisation.gouv.fr";
const NOMBRE_ANNEE_AVANT_SUPPRESSION = 2;

export class SupprimerLesComptesDesactivesUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private commentaireRepository: CommentaireRepository;

  private syntheseDesResultatsRepository: SyntheseDesResultatsRepository;

  private decisionStrategiqueRepository: DecisionStrategiqueRepository;

  private objectifRepository: ObjectifRepository;

  private rapportRepository: RapportRepository;

  private propositionValeurAvancementRepository: PropositionValeurAvancementRepository;

  private historisationModification: HistorisationModificationRepository;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    commentaireRepository,
    syntheseDesResultatsRepository,
    decisionStrategiqueRepository,
    objectifRepository,
    rapportRepository,
    propositionValeurAvancementRepository,
    historisationModification,
  }: Dependencies) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.commentaireRepository = commentaireRepository;
    this.syntheseDesResultatsRepository = syntheseDesResultatsRepository;
    this.decisionStrategiqueRepository = decisionStrategiqueRepository;
    this.objectifRepository = objectifRepository;
    this.rapportRepository = rapportRepository;
    this.propositionValeurAvancementRepository =
      propositionValeurAvancementRepository;
    this.historisationModification = historisationModification;
  }

  async run(): Promise<{ id: string; email: string }[]> {
    const dateDesactivationMax = new Date();
    dateDesactivationMax.setFullYear(
      dateDesactivationMax.getFullYear() - NOMBRE_ANNEE_AVANT_SUPPRESSION,
    );
    const utilisateursInactifs =
      await this.utilisateurRepository.recupererComptesInactifs(
        dateDesactivationMax,
      );
    logger.info(`${utilisateursInactifs.length} utilisateurs à supprimer`);

    const { listeUtilisateurASupprimerIds, listeUtilisateurASupprimerEmails } =
      utilisateursInactifs.reduce(
        (acc, utilisateur) => {
          acc.listeUtilisateurASupprimerIds.push(utilisateur.id);
          acc.listeUtilisateurASupprimerEmails.push(utilisateur.email);
          return acc;
        },
        {
          listeUtilisateurASupprimerIds: [] as string[],
          listeUtilisateurASupprimerEmails: [] as string[],
        },
      );
    await this.commentaireRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.syntheseDesResultatsRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.decisionStrategiqueRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.objectifRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.utilisateurRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.rapportRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerEmails,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.propositionValeurAvancementRepository.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.historisationModification.anonymiserAuteurs(
      listeUtilisateurASupprimerIds,
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    await this.utilisateurRepository.supprimerListeUtilisateur(
      listeUtilisateurASupprimerIds,
    );
    for (const email of listeUtilisateurASupprimerEmails) {
      await this.utilisateurIAMRepository.supprime(email);
    }
    return utilisateursInactifs;
  }
}
