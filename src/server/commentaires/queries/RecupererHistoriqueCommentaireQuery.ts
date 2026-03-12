import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  CODES_TYPES_COMMENTAIRES,
  NOMS_TYPES_COMMENTAIRES,
} from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";

export type CommentaireHistoriqueItem = {
  chantierId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurModificationNom: string;
};

export class RecupererHistoriqueCommentaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    type: TypeCommentaireChantier,
  ): Promise<CommentaireHistoriqueItem[]> {
    const commentaires = await this.deps.prisma
      .getInstance()
      .commentaire.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          type: CODES_TYPES_COMMENTAIRES[type],
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_modification: true },
        orderBy: { date_modification: "desc" },
      });

    return commentaires.map((commentaire) => ({
      chantierId: commentaire.chantier_id,
      territoireCode: commentaire.territoire_code,
      type: NOMS_TYPES_COMMENTAIRES[commentaire.type],
      contenu: commentaire.contenu,
      dateCreation: commentaire.date_creation.toISOString(),
      dateModification: commentaire.date_modification.toISOString(),
      auteurModificationNom: commentaire.auteur_modification
        ? `${commentaire.auteur_modification.prenom} ${commentaire.auteur_modification.nom}`
        : "Auteur Inconnu",
    }));
  }
}
