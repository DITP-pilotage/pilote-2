import { randomUUID } from "node:crypto";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ImportCommentaireContrat } from "@/server/import-commentaire/app/contrats/ImportCommentaireAPIContrat";
import { mapTypeCommentaireAPIVersDomaine } from "@/validation/importCommentaire";

export interface ImporterCommentairesInput {
  chantierId: string;
  commentaires: ImportCommentaireContrat[];
  auteurId: string;
  habilitations: Habilitations;
}

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
  }: ImporterCommentairesInput): Promise<void> {
    for (const commentaire of commentaires) {
      const id = randomUUID();
      const date = commentaire.date_commentaire
        ? new Date(commentaire.date_commentaire)
        : new Date();
      const typeDomaine = mapTypeCommentaireAPIVersDomaine(commentaire.type);

      await this.dependencies.commentaireRepository.créer(
        chantierId,
        commentaire.territoire,
        id,
        commentaire.contenu,
        auteurId,
        typeDomaine,
        date,
      );
    }
  }
}
