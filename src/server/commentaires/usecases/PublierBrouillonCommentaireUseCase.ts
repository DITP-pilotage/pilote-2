import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { publierBrouillonCommentaire } from "@/server/domain/chantier/commentaire/Commentaire";

export class PublierBrouillonCommentaireUseCase {
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

    const commentaire = publierBrouillonCommentaire(brouillon, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.commentaireRepository.save(commentaire);
  }
}
