import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { creerCommentairePublie } from "@/server/domain/chantier/commentaire/Commentaire";

export class PublierCommentaireUseCase {
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

    const commentaire = creerCommentairePublie({
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
