import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  CommentaireV2,
  TypeCommentaireChantier,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  CODES_TYPES_COMMENTAIRES,
  NOMS_TYPES_COMMENTAIRES,
} from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";

const TOUS_LES_TYPES: TypeCommentaireChantier[] = [
  ...typesCommentaireMailleNationale,
  ...typesCommentaireMailleRégionaleOuDépartementale,
];

export class RecupererBrouillonCommentaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    utilisateurId: string,
  ): Promise<Record<TypeCommentaireChantier, CommentaireV2 | null>> {
    const brouillons = await this.deps.prisma
      .getInstance()
      .commentaire.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_publication.BROUILLON,
          auteur_modification_id: utilisateurId,
        },
        orderBy: { date_modification: "desc" },
      });

    const dernierBrouillonParType = new Map<
      string,
      (typeof brouillons)[number]
    >();
    for (const brouillon of brouillons) {
      if (!dernierBrouillonParType.has(brouillon.type)) {
        dernierBrouillonParType.set(brouillon.type, brouillon);
      }
    }

    return Object.fromEntries(
      TOUS_LES_TYPES.map((type) => {
        const typeDb = CODES_TYPES_COMMENTAIRES[type];
        const brouillon = dernierBrouillonParType.get(typeDb) ?? null;

        if (!brouillon) return [type, null];

        return [
          type,
          {
            id: brouillon.id,
            chantierId: brouillon.chantier_id,
            territoireCode: brouillon.territoire_code,
            type: NOMS_TYPES_COMMENTAIRES[brouillon.type],
            contenu: brouillon.contenu,
            statut: brouillon.statut,
            auteurCreationId: brouillon.auteur_creation_id,
            dateCreation: brouillon.date_creation.toISOString(),
            auteurModificationId: brouillon.auteur_modification_id,
            dateModification: brouillon.date_modification.toISOString(),
          },
        ];
      }),
    ) as Record<TypeCommentaireChantier, CommentaireV2 | null>;
  }
}
