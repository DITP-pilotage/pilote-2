import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import {
  ImportCommentaireInput,
  mapTypeCommentaireAPIVersDomaine,
} from "@/validation/import-commentaire";
import { CommentaireV2 } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import type { Inject } from "@/server/commentaires/module";

export class ImporterCommentairesUseCase {
  private readonly commentaireRepository: CommentaireRepository;

  constructor({ commentaireRepository }: Inject<"commentaireRepository">) {
    this.commentaireRepository = commentaireRepository;
  }

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
        auteurCreationId: auteurId,
        auteurModificationId: auteurId,
        dateCreation: date.toISOString(),
        dateModification: date.toISOString(),
        type: typeDomaine,
        statut: $Enums.statut_publication.PUBLIE,
      };

      await this.commentaireRepository.save(commentaireV2);
    }
  }
}
