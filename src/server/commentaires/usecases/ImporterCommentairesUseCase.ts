import { randomUUID } from "node:crypto";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import {
  ImportCommentaireInput,
  mapTypeCommentaireAPIVersDomaine,
} from "@/validation/import-commentaire";
import { CommentaireV2 } from "@/server/domain/chantier/commentaire/Commentaire.interface";

export class ImporterCommentairesUseCase {
  constructor(
    private readonly dependencies: {
      commentaireRepository: CommentaireRepository;
    },
  ) {}

  async execute({
    chantierId,
    commentaires,
    auteurId,
  }: {
    chantierId: string;
    commentaires: ImportCommentaireInput[];
    auteurId: string;
  }): Promise<void> {
    for (const commentaire of commentaires) {
      const id = randomUUID();
      const date = commentaire.date_commentaire
        ? new Date(commentaire.date_commentaire)
        : new Date();

      const typeDomaine = mapTypeCommentaireAPIVersDomaine(commentaire.type);

      const commentaireV2: CommentaireV2 = {
        chantierId,
        territoireCode: commentaire.territoire,
        id,
        contenu: commentaire.contenu,
        auteur_id: auteurId,
        type: typeDomaine,
        date,
      };

      await this.dependencies.commentaireRepository.save(commentaireV2);
    }
  }
}
