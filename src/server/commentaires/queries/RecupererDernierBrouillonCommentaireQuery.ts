import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { CommentaireV2, TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES } from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";

export class RecupererDernierBrouillonCommentaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    type: TypeCommentaireChantier,
    utilisateurId: string,
  ): Promise<CommentaireV2 | null> {
    const brouillon = await this.deps.prisma.getInstance().commentaire.findFirst({
      where: {
        chantier_id: chantierId,
        territoire_code: territoireCode,
        type: CODES_TYPES_COMMENTAIRES[type],
        statut: $Enums.statut_publication.BROUILLON,
        auteur_modification_id: utilisateurId,
      },
      orderBy: { date_modification: "desc" },
    });

    if (!brouillon) return null;

    return {
      id: brouillon.id,
      chantierId: brouillon.chantier_id,
      territoireCode: brouillon.territoire_code,
      type: NOMS_TYPES_COMMENTAIRES[brouillon.type],
      contenu: brouillon.contenu,
      statut: brouillon.statut,
      auteurCreationId: brouillon.auteur_creation_id ?? "",
      dateCreation: brouillon.date_creation.toISOString(),
      auteurModificationId: brouillon.auteur_modification_id ?? "",
      dateModification: brouillon.date_modification.toISOString(),
    };
  }
}
