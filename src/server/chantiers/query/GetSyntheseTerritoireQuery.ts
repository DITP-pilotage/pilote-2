import { Maille } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  calculerMediane,
  calculerMoyenne,
} from "@/client/utils/statistiques/statistiques";

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

type ChantierEnRetard = {
  chantier: ChantierIdentiteSynthese;
  ecart: number;
  taux_avancement: number | null;
  synthese: SyntheseResultat | null;
};

type ChantierEnDifficulte = {
  chantier: ChantierIdentiteSynthese;
  meteo: "ORAGE" | "NUAGE";
  ecart: number | null;
  taux_avancement: number | null;
  synthese: SyntheseResultat | null;
};

export type GetSyntheseTerritoireResult = {
  territoire_code: string;
  territoire_nom: string;
  taux_avancement_global: number | null;
  mediane_repartition: number | null;
  position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
  chantiers_en_retard: ChantierEnRetard[];
  chantiers_en_difficulte: ChantierEnDifficulte[];
};

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "NAT";
  if (territoireCode.startsWith("REG")) return "REG";
  return "DEPT";
}

export class GetSyntheseTerritoireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
  }): Promise<GetSyntheseTerritoireResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
    });

    const chantiersTerritoire = await prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: { statut: "PUBLIE" },
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

    const maille = determineMaille(params.territoireCode);

    const moyennesParTerritoire = await prisma.chantier_territoire.groupBy({
      by: ["territoire_code"],
      _avg: { taux_avancement_mandat: true },
      where: {
        maille,
        est_applicable: true,
        chantier_identite: { statut: "PUBLIE" },
        NOT: { taux_avancement_mandat: { equals: null } },
      },
      orderBy: { _avg: { taux_avancement_mandat: "asc" } },
    });

    const mediane = calculerMediane(
      moyennesParTerritoire.map((t) => t._avg.taux_avancement_mandat),
    );

    const taux_avancement_global = calculerMoyenne(
      chantiersTerritoire.map(
        (c) => c.chantier_territoire_jalon[0]?.taux_avancement,
      ),
    );

    let position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null =
      null;
    if (taux_avancement_global !== null && mediane !== null) {
      const ecart = taux_avancement_global - mediane;
      if (ecart <= -10) {
        position_mediane = "EN_RETARD";
      } else if (ecart >= 10) {
        position_mediane = "EN_AVANCE";
      } else {
        position_mediane = "DANS_LA_MEDIANE";
      }
    }

    const chantiers_en_retard: ChantierEnRetard[] = chantiersTerritoire
      .filter((c) => c.ecart !== null && c.ecart <= -10)
      .map((c) => ({
        chantier: {
          id: c.chantier_identite.id,
          nom: c.chantier_identite.nom,
          axe: c.chantier_identite.axe,
          ppg: c.chantier_identite.ppg,
          ministeres: c.chantier_identite.ministeres_acronymes,
        },
        ecart: c.ecart!,
        taux_avancement: c.chantier_territoire_jalon[0]?.taux_avancement,
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
      .sort((a, b) => a.ecart - b.ecart);

    const chantierIdsEnRetard = new Set(
      chantiers_en_retard.map((c) => c.chantier.id),
    );

    const chantiers_en_difficulte: ChantierEnDifficulte[] = chantiersTerritoire
      .filter(
        (c) =>
          (c.meteo === "ORAGE" || c.meteo === "NUAGE") &&
          !chantierIdsEnRetard.has(c.chantier_identite.id),
      )
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
      taux_avancement_global,
      mediane_repartition: mediane,
      position_mediane,
      chantiers_en_retard,
      chantiers_en_difficulte,
    };
  }
}
