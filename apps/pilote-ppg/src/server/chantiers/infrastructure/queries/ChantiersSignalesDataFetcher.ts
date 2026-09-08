import { $Enums } from "@prisma/client";
import { Inject } from "@/server/chantiers/module";

export type ChantierTerritoireSignale = {
  id: string;
  meteo: string | null;
  tendance: $Enums.type_tendance | null;
  nombre_propositions_valeur_actuelle: number;
  maille: string;
  chantier_identite: { nom: string; cible_attendue: boolean };
  chantier_territoire_jalon: {
    ecart: number | null;
    taux_avancement: number | null;
  }[];
};

export class ChantiersSignalesDataFetcher {
  constructor(private readonly deps: Inject<"prisma">) {}

  async recupererChantierTerritoires(params: {
    chantierIds: string[];
    territoireCode: string;
    jalon: number;
    statutPublieUniquement?: boolean;
  }): Promise<ChantierTerritoireSignale[]> {
    const prisma = this.deps.prisma.getInstance();

    return prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
          ...(params.statutPublieUniquement ? { statut: "PUBLIE" } : {}),
        },
        id: { in: params.chantierIds },
      },
      select: {
        id: true,
        meteo: true,
        tendance: true,
        nombre_propositions_valeur_actuelle: true,
        maille: true,
        chantier_identite: {
          select: { nom: true, cible_attendue: true },
        },
        chantier_territoire_jalon: {
          where: { jalon: params.jalon },
          select: { ecart: true, taux_avancement: true },
        },
      },
    });
  }

  async recupererPvaIds(
    maille: string,
    chantierIdsApplicables: string[],
    territoireCode: string,
  ): Promise<Set<string>> {
    const prisma = this.deps.prisma.getInstance();

    if (maille === "NAT") {
      const enfants = await prisma.chantier_territoire.findMany({
        where: {
          id: { in: chantierIdsApplicables },
          maille: { in: ["REG", "DEPT"] },
          est_applicable: true,
          nombre_propositions_valeur_actuelle: { gt: 0 },
        },
        select: { id: true },
      });
      return new Set(enfants.map((e) => e.id));
    }

    if (maille === "REG") {
      const territoiresEnfants = await prisma.territoire.findMany({
        where: { code_parent: territoireCode },
        select: { code: true },
      });
      const codesEnfants = territoiresEnfants.map((t) => t.code);
      const enfants = await prisma.chantier_territoire.findMany({
        where: {
          id: { in: chantierIdsApplicables },
          territoire_code: { in: [territoireCode, ...codesEnfants] },
          est_applicable: true,
          nombre_propositions_valeur_actuelle: { gt: 0 },
        },
        select: { id: true },
      });
      return new Set(enfants.map((e) => e.id));
    }

    return new Set();
  }

  async recupererAbsenceTauxDepartementalSets(
    maille: string,
    chantierTerritoires: ChantierTerritoireSignale[],
    jalon: number,
  ): Promise<{
    chantiersAvecDept: Set<string>;
    chantiersAvecTaux: Set<string>;
  }> {
    if (maille !== "NAT") {
      return { chantiersAvecDept: new Set(), chantiersAvecTaux: new Set() };
    }

    const prisma = this.deps.prisma.getInstance();

    const chantierIdsCibleAttendue = chantierTerritoires
      .filter((ct) => ct.chantier_identite.cible_attendue)
      .map((ct) => ct.id);

    if (chantierIdsCibleAttendue.length === 0) {
      return { chantiersAvecDept: new Set(), chantiersAvecTaux: new Set() };
    }

    const deptApplicables = await prisma.chantier_territoire.findMany({
      where: {
        id: { in: chantierIdsCibleAttendue },
        maille: "DEPT",
        est_applicable: true,
      },
      select: {
        id: true,
        chantier_territoire_jalon: {
          where: { jalon },
          select: { taux_avancement: true },
        },
      },
    });

    const chantiersAvecTaux = new Set(
      deptApplicables
        .filter((dept) =>
          dept.chantier_territoire_jalon.some(
            (j) => j.taux_avancement !== null,
          ),
        )
        .map((dept) => dept.id),
    );

    const chantiersAvecDept = new Set(deptApplicables.map((dept) => dept.id));

    return { chantiersAvecDept, chantiersAvecTaux };
  }
}
