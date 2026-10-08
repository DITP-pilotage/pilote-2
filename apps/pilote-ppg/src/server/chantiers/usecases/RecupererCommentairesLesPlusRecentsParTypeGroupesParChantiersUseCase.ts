import { CommentaireRepository } from "@/server/commentaires/infrastructure/sql/CommentaireRepository.interface";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

export class RecupererCommentairesLesPlusRecentsParTypeGroupesParChantiersUseCase {
  private readonly commentaireRepository: CommentaireRepository;

  constructor({
    commentaireRepository,
  }: {
    commentaireRepository: CommentaireRepository;
  }) {
    this.commentaireRepository = commentaireRepository;
  }

  async run(
    chantierIds: string[],
    territoireCode: string,
    habilitations: Habilitations,
  ) {
    const habilitation = new Habilitation(habilitations);
    chantierIds.forEach((chantierId) => {
      habilitation.vérifierLesHabilitationsEnLecture(
        chantierId,
        territoireCode,
      );
    });

    return this.commentaireRepository.récupérerLesPlusRécentsGroupésParChantier(
      chantierIds,
      territoireCode,
    );
  }
}
