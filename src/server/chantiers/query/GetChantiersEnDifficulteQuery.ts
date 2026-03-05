import { PrismaPilote } from "@/server/db/PrismaPilote";

type ChantierIdentiteSynthese = {
  id: string;
  nom: string;
  axe: string;
  ppg: string;
  ministeres: string[];
};

type SyntheseResultat = {
  meteo: string | null;
  commentaire: string | null;
  date_meteo: string | null;
  date_commentaire: string | null;
};

export type ChantierEnDifficulte = {
  chantier: ChantierIdentiteSynthese;
  meteo: "ORAGE" | "NUAGE";
  ecart: number | null;
  taux_avancement: number | null;
  synthese: SyntheseResultat | null;
};

export type GetChantiersEnDifficulteResult = {
  territoire_code: string;
  territoire_nom: string;
  jalon: number;
  chantiers_en_difficulte: ChantierEnDifficulte[];
};

export class GetChantiersEnDifficulteQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
  }): Promise<GetChantiersEnDifficulteResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
    });

    // Excludes en-retard chantiers directly via WHERE clause (ecart IS NULL OR ecart > -10)
    const chantiersTerritoire = await prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: { statut: "PUBLIE" },
        meteo: { in: ["ORAGE", "NUAGE"] },
        OR: [{ ecart: null }, { ecart: { gt: -10 } }],
      },
      include: {
        chantier_identite: true,
        chantier_territoire_jalon: {
          where: { jalon: params.jalon },
        },
        syntheses_des_resultats: {
          orderBy: { date_modification: "desc" },
          take: 1,
        },
      },
    });

    const chantiers_en_difficulte: ChantierEnDifficulte[] = chantiersTerritoire
      .map((c) => ({
        chantier: {
          id: c.chantier_identite.id,
          nom: c.chantier_identite.nom,
          axe: c.chantier_identite.axe,
          ppg: c.chantier_identite.ppg,
          ministeres: c.chantier_identite.ministeres_acronymes,
        },
        meteo: c.meteo as "ORAGE" | "NUAGE",
        ecart: c.ecart,
        taux_avancement: c.taux_avancement_mandat,
        synthese:
          c.syntheses_des_resultats.length > 0
            ? {
                meteo: c.syntheses_des_resultats[0].meteo,
                commentaire: c.syntheses_des_resultats[0].commentaire,
                date_meteo:
                  c.syntheses_des_resultats[0].date_modification?.toISOString() ??
                  null,
                date_commentaire:
                  c.syntheses_des_resultats[0].date_modification?.toISOString() ??
                  null,
              }
            : null,
      }))
      .sort((a, b) => {
        if (a.meteo === "ORAGE" && b.meteo !== "ORAGE") return -1;
        if (a.meteo !== "ORAGE" && b.meteo === "ORAGE") return 1;
        return 0;
      });

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      jalon: params.jalon,
      chantiers_en_difficulte,
    };
  }
}
