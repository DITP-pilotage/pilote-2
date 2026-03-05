import { Maille } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  calculerMediane,
  calculerMoyenne,
} from "@/client/utils/statistiques/statistiques";

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "NAT";
  if (territoireCode.startsWith("REG")) return "REG";
  return "DEPT";
}

export type GetTauxAvancementTerritoireResult = {
  territoire_code: string;
  territoire_nom: string;
  jalon: number;
  taux_avancement_global: number | null;
  mediane_repartition: number | null;
  position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
  nombre_chantiers: number;
};

export class GetTauxAvancementTerritoireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
  }): Promise<GetTauxAvancementTerritoireResult> {
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
        chantier_territoire_jalon: {
          where: { jalon: params.jalon },
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

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      jalon: params.jalon,
      taux_avancement_global,
      mediane_repartition: mediane,
      position_mediane,
      nombre_chantiers: chantiersTerritoire.length,
    };
  }
}
