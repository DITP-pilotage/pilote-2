import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type GetChantierCommentairesResult = {
  territoire_code: string;
  chantier_id: string;
  commentaires: {
    id: string;
    date_publication: string;
    contenu: string;
    auteur: {
      id: string;
      nom: string;
    };
    type: string;
  }[];
};

export class GetChantierCommentairesQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    chantierId: string;
  }): Promise<GetChantierCommentairesResult> {
    const prisma = this.deps.prisma.getInstance();

    const [commentaires, syntheses, objectifs] = await Promise.all([
      prisma.commentaire.findMany({
        where: {
          chantier_id: params.chantierId,
          territoire_code: params.territoireCode,
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_modification: true },
      }),
      prisma.synthese_des_resultats.findMany({
        where: {
          chantier_id: params.chantierId,
          territoire_code: params.territoireCode,
          statut: $Enums.statut_publication.PUBLIE,
          commentaire: { not: null },
        },
        include: { auteur_modification: true },
      }),
      prisma.objectif.findMany({
        where: {
          chantier_id: params.chantierId,
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_modification: true },
      }),
    ]);

    const items: GetChantierCommentairesResult["commentaires"] = [
      ...commentaires.map((commentaire) => ({
        id: commentaire.id,
        date_publication: commentaire.date_modification.toISOString(),
        contenu: commentaire.contenu,
        auteur: {
          id: commentaire.auteur_modification.id,
          nom: `${commentaire.auteur_modification.prenom} ${commentaire.auteur_modification.nom}`,
        },
        type: commentaire.type,
      })),
      ...syntheses.map((synthese) => ({
        id: synthese.id,
        date_publication: synthese.date_modification.toISOString(),
        contenu: synthese.commentaire as string,
        auteur: {
          id: synthese.auteur_modification.id,
          nom: `${synthese.auteur_modification.prenom} ${synthese.auteur_modification.nom}`,
        },
        type: "synthese_des_resultats",
      })),
      ...objectifs.map((objectif) => ({
        id: objectif.id,
        date_publication: objectif.date_modification.toISOString(),
        contenu: objectif.contenu,
        auteur: {
          id: objectif.auteur_modification.id,
          nom: `${objectif.auteur_modification.prenom} ${objectif.auteur_modification.nom}`,
        },
        type: `objectif_${objectif.type}`,
      })),
    ];

    items.sort((left, right) =>
      right.date_publication.localeCompare(left.date_publication),
    );

    return {
      territoire_code: params.territoireCode,
      chantier_id: params.chantierId,
      commentaires: items,
    };
  }
}
