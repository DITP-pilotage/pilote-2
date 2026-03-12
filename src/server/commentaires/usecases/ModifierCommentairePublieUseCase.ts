import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { modifierCommentaire } from "@/server/domain/chantier/commentaire/Commentaire";

export class ModifierCommentairePublieUseCase {
  constructor(
    private readonly dependencies: {
      commentaireRepository: CommentaireRepository;
    },
  ) {}

  async execute({
    commentaireId,
    contenu,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    commentaireId: string;
    contenu: string;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    const commentaireAModifier =
      await this.dependencies.commentaireRepository.getById(commentaireId);

    if (!commentaireAModifier)
      throw new Error(`Commentaire introuvable : ${commentaireId}`);

    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      commentaireAModifier.chantierId,
      commentaireAModifier.territoireCode,
    );

    const commentaire = modifierCommentaire(commentaireAModifier, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.commentaireRepository.save(commentaire);
  }
}
