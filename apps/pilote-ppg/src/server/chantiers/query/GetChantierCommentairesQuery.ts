import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { extractVisibleText } from "@/utils/extractVisibleText";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";

export type GetChantierCommentairesResult = {
  territoire_code: string;
  maille: "nationale" | "régionale" | "départementale";
  synthese_des_resultats: {
    meteo: { valeur: string; libelle: string } | null;
    contenu: string | null;
    date_publication: string;
  } | null;
  commentaires: {
    type: string;
    contenu: string;
    date_publication: string;
  }[];
  decisions_strategiques: {
    contenu: string;
    date_publication: string;
  }[];
};

function mailleFromCode(
  code: string,
): "nationale" | "régionale" | "départementale" {
  if (code.startsWith("NAT-")) return "nationale";
  if (code.startsWith("REG-")) return "régionale";
  return "départementale";
}

export class GetChantierCommentairesQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    chantierId: string;
  }): Promise<GetChantierCommentairesResult> {
    const prisma = this.deps.prisma.getInstance();

    const [commentaires, syntheses, decisions] = await Promise.all([
      prisma.commentaire.findMany({
        where: {
          chantier_id: params.chantierId,
          territoire_code: params.territoireCode,
          statut: $Enums.statut_publication.PUBLIE,
        },
      }),
      prisma.synthese_des_resultats.findMany({
        where: {
          chantier_id: params.chantierId,
          territoire_code: params.territoireCode,
          statut: $Enums.statut_publication.PUBLIE,
        },
      }),
      params.territoireCode === "NAT-FR"
        ? prisma.decision_strategique.findMany({
            where: {
              chantier_id: params.chantierId,
              statut: $Enums.statut_publication.PUBLIE,
            },
            orderBy: { date_modification: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const synthese = syntheses[0] ?? null;

    return {
      territoire_code: params.territoireCode,
      maille: mailleFromCode(params.territoireCode),
      synthese_des_resultats: synthese
        ? {
            meteo: synthese.meteo
              ? {
                  valeur: synthese.meteo,
                  libelle: libellesMeteos[synthese.meteo] ?? synthese.meteo,
                }
              : null,
            contenu: synthese.commentaire
              ? extractVisibleText(synthese.commentaire)
              : null,
            date_publication: synthese.date_modification.toISOString(),
          }
        : null,
      commentaires: commentaires.map((commentaire) => ({
        type: commentaire.type,
        contenu: extractVisibleText(commentaire.contenu),
        date_publication: commentaire.date_modification.toISOString(),
      })),
      decisions_strategiques: decisions.map((decision) => ({
        contenu: extractVisibleText(decision.contenu),
        date_publication: decision.date_modification.toISOString(),
      })),
    };
  }
}
