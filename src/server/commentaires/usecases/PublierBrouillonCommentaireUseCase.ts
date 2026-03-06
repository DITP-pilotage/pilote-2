import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { CommentaireV2 } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { modifierCommentaire } from "@/server/domain/chantier/commentaire/Commentaire";

export class PublierBrouillonCommentaireUseCase {
  constructor(
    private readonly dependencies: {
      commentaireRepository: CommentaireRepository;
    },
  ) {}

  async execute({
    brouillon,
    contenu,
    auteurModificationId,
    dateModification,
    habilitations,
  }: {
    brouillon: CommentaireV2;
    contenu: string;
    auteurModificationId: string;
    dateModification: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      brouillon.chantierId,
      brouillon.territoireCode,
    );

    const commentaire = modifierCommentaire(brouillon, {
      contenu,
      auteurModificationId,
      dateModification,
    });

    await this.dependencies.commentaireRepository.save(commentaire);
  }
}
