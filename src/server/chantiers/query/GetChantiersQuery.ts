import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Prisma } from "@prisma/client";

type ChantierIdentite = {
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

export type ChantierResult = {
  chantier: ChantierIdentite;
  meteo: string | null;
  tendance: string | null;
  ecart: number | null;
  taux_avancement: number | null;
  est_en_retard: boolean;
  est_en_difficulte: boolean;
  synthese: SyntheseResultat | null;
};

export type GetChantiersResult = {
  territoire_code: string;
  territoire_nom: string;
  jalon: number;
  chantiers: ChantierResult[];
};

type GetChantiersParId = {
  mode: "par_id";
  territoireCode: string;
  jalon: number;
  chantierIds: string[];
};

type GetChantiersParFiltre = {
  mode: "par_filtre";
  territoireCode: string;
  jalon: number;
  view: "all" | "en_retard" | "en_difficulte";
  tendance?: "HAUSSE" | "BAISSE" | "STAGNATION";
  meteo?: "SOLEIL" | "COUVERT" | "NUAGE" | "ORAGE";
};

export type GetChantiersParams = GetChantiersParId | GetChantiersParFiltre;

export class GetChantiersQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: GetChantiersParams): Promise<GetChantiersResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
    });

    const where = this.buildWhere(params);

    const chantiersTerritoire = await prisma.chantier_territoire.findMany({
      where,
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

    const chantiers: ChantierResult[] = chantiersTerritoire.map((ct) => {
      const jalon = ct.chantier_territoire_jalon[0];
      const ecart = jalon?.ecart ?? null;
      const meteo = ct.meteo;
      const estEnRetard = ecart !== null && ecart <= -10;
      const estEnDifficulte =
        !estEnRetard &&
        (meteo === "ORAGE" || meteo === "NUAGE");

      return {
        chantier: {
          id: ct.chantier_identite.id,
          nom: ct.chantier_identite.nom,
          axe: ct.chantier_identite.axe,
          ppg: ct.chantier_identite.ppg,
          ministeres: ct.chantier_identite.ministeres_acronymes,
        },
        meteo: ct.meteo,
        tendance: ct.tendance,
        ecart,
        taux_avancement: jalon?.taux_avancement ?? ct.taux_avancement_mandat,
        est_en_retard: estEnRetard,
        est_en_difficulte: estEnDifficulte,
        synthese:
          ct.syntheses_des_resultats.length > 0
            ? {
                meteo: ct.syntheses_des_resultats[0].meteo,
                commentaire: ct.syntheses_des_resultats[0].commentaire,
                date_meteo:
                  ct.syntheses_des_resultats[0].date_modification?.toISOString() ??
                  null,
                date_commentaire:
                  ct.syntheses_des_resultats[0].date_modification?.toISOString() ??
                  null,
              }
            : null,
      };
    });

    const view = params.mode === "par_filtre" ? params.view : undefined;
    const sorted = this.sort(chantiers, view);

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      jalon: params.jalon,
      chantiers: sorted,
    };
  }

  private buildWhere(
    params: GetChantiersParams,
  ): Prisma.chantier_territoireWhereInput {
    const base: Prisma.chantier_territoireWhereInput = {
      territoire_code: params.territoireCode,
      est_applicable: true,
      chantier_identite: { statut: "PUBLIE" },
    };

    if (params.mode === "par_id") {
      return { ...base, id: { in: params.chantierIds } };
    }

    const filters: Prisma.chantier_territoireWhereInput[] = [];

    if (params.view === "en_retard") {
      filters.push({
        chantier_territoire_jalon: {
          some: { jalon: params.jalon, ecart: { lte: -10 } },
        },
      });
    }

    if (params.view === "en_difficulte") {
      filters.push({
        meteo: { in: ["ORAGE", "NUAGE"] },
        OR: [{ ecart: null }, { ecart: { gt: -10 } }],
      });
    }

    if (params.tendance) {
      filters.push({ tendance: params.tendance });
    }

    if (params.meteo) {
      filters.push({ meteo: params.meteo });
    }

    if (filters.length === 0) {
      return base;
    }

    return { ...base, AND: filters };
  }

  private sort(
    chantiers: ChantierResult[],
    view?: "all" | "en_retard" | "en_difficulte",
  ): ChantierResult[] {
    return [...chantiers].sort((a, b) => {
      if (view === "en_retard") {
        return (a.ecart ?? 0) - (b.ecart ?? 0);
      }

      if (view === "en_difficulte") {
        if (a.meteo === "ORAGE" && b.meteo !== "ORAGE") return -1;
        if (a.meteo !== "ORAGE" && b.meteo === "ORAGE") return 1;
        return 0;
      }

      return a.chantier.id.localeCompare(b.chantier.id);
    });
  }
}
