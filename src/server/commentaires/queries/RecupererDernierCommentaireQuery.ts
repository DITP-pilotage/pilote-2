import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { CODES_TYPES_COMMENTAIRES, NOMS_TYPES_COMMENTAIRES } from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";

const TOUS_LES_TYPES: TypeCommentaireChantier[] = [
  ...typesCommentaireMailleNationale,
  ...typesCommentaireMailleRégionaleOuDépartementale,
];

export class RecupererDernierCommentaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    utilisateurId: string,
  ): Promise<Record<TypeCommentaireChantier, CommentaireAvecNomsAuteurs | null>> {
    const [commentaires, brouillons] = await Promise.all([
      this.deps.prisma.getInstance().commentaire.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_modification: true },
        orderBy: { date_modification: "desc" },
      }),
      this.deps.prisma.getInstance().commentaire.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          statut: $Enums.statut_publication.BROUILLON,
          auteur_modification_id: utilisateurId,
        },
        orderBy: { date_modification: "desc" },
      }),
    ]);

    const dernierBrouillonParType = new Map(
      brouillons.map((brouillon) => [brouillon.type, brouillon.date_modification.toISOString()]),
    );

    const dernierCommentaireParType = new Map<string, (typeof commentaires)[number]>();
    for (const commentaire of commentaires) {
      if (!dernierCommentaireParType.has(commentaire.type)) {
        dernierCommentaireParType.set(commentaire.type, commentaire);
      }
    }

    return Object.fromEntries(
      TOUS_LES_TYPES.map((type) => {
        const typeDb = CODES_TYPES_COMMENTAIRES[type];
        const commentaire = dernierCommentaireParType.get(typeDb) ?? null;

        if (!commentaire) return [type, null];

        return [
          type,
          {
            id: commentaire.id,
            chantierId: commentaire.chantier_id,
            territoireCode: commentaire.territoire_code,
            type: NOMS_TYPES_COMMENTAIRES[commentaire.type],
            contenu: commentaire.contenu,
            statut: commentaire.statut,
            auteurCreationId: commentaire.auteur_creation_id ?? "",
            dateCreation: commentaire.date_creation.toISOString(),
            auteurModificationId: commentaire.auteur_modification_id ?? "",
            dateModification: commentaire.date_modification.toISOString(),
            auteurModificationNom: commentaire.auteur_modification
              ? `${commentaire.auteur_modification.prenom} ${commentaire.auteur_modification.nom}`
              : "Auteur Inconnu",
            dateDernierBrouillon: dernierBrouillonParType.get(typeDb) ?? null,
          },
        ];
      }),
    ) as Record<TypeCommentaireChantier, CommentaireAvecNomsAuteurs | null>;
  }
}
