import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { CommentaireRepository } from "@/server/commentaires/infrastructure/sql/CommentaireRepository.interface";
import { modifierCommentaireBrouillon } from "@/server/commentaires/domain/Commentaire";

export class ModifierBrouillonCommentaireUseCase {
  constructor(
    private readonly dependencies: {
      commentaireRepository: CommentaireRepository;
    },
  ) {}

  async execute({
    brouillonId,
    contenu,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    brouillonId: string;
    contenu: string;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const brouillon =
      await this.dependencies.commentaireRepository.getById(brouillonId);

    if (!brouillon) throw new Error(`Brouillon introuvable : ${brouillonId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      brouillon.chantierId,
      brouillon.territoireCode,
    );

    const commentaire = modifierCommentaireBrouillon(brouillon, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.commentaireRepository.save(commentaire);
  }
}
