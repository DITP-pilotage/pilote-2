import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { TypeCommentaireChantier } from "@/shared/chantier/commentaire/Commentaire.interface";
import { CommentaireRepository } from "@/server/commentaires/infrastructure/sql/CommentaireRepository.interface";
import { creerCommentaireBrouillon } from "@/server/commentaires/domain/Commentaire";

export class EnregistrerBrouillonCommentaireUseCase {
  constructor(
    private readonly dependencies: {
      commentaireRepository: CommentaireRepository;
    },
  ) {}

  async execute({
    chantierId,
    territoireCode,
    type,
    contenu,
    auteurId,
    date,
    habilitations,
  }: {
    chantierId: string;
    territoireCode: string;
    type: TypeCommentaireChantier;
    contenu: string;
    auteurId: string;
    date: string;
    habilitations: Habilitations;
  }): Promise<void> {
    new Habilitation(
      habilitations,
    ).vérifierLesHabilitationsEnSaisieDesPublications(
      chantierId,
      territoireCode,
    );

    const commentaire = creerCommentaireBrouillon({
      chantierId,
      territoireCode,
      type,
      contenu,
      auteurId,
      date,
    });

    await this.dependencies.commentaireRepository.save(commentaire);
  }
}
