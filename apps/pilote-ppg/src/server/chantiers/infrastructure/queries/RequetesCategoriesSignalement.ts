import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
import { ChantierTerritoireAvecJalon } from "@/server/chantiers/domain/CalculCategoriesSignalement";

export async function compterPva(
  prisma: PilotePrismaClient,
  maille: string,
  chantierIdsApplicables: string[],
  params: { territoireCode: string },
): Promise<Set<string>> {
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
      where: { code_parent: params.territoireCode },
      select: { code: true },
    });
    const codesEnfants = territoiresEnfants.map((t) => t.code);
    const enfants = await prisma.chantier_territoire.findMany({
      where: {
        id: { in: chantierIdsApplicables },
        territoire_code: { in: [params.territoireCode, ...codesEnfants] },
        est_applicable: true,
        nombre_propositions_valeur_actuelle: { gt: 0 },
      },
      select: { id: true },
    });
    return new Set(enfants.map((e) => e.id));
  }

  return new Set();
}

export async function chantiersSansTauxDepartemental(
  prisma: PilotePrismaClient,
  maille: string,
  chantierTerritoires: ChantierTerritoireAvecJalon[],
  jalonParDefaut: number,
): Promise<Set<string>> {
  if (maille !== "NAT") return new Set();

  const chantierIdsCibleAttendue = chantierTerritoires
    .filter((ct) => ct.chantier_identite.cible_attendue)
    .map((ct) => ct.id);

  if (chantierIdsCibleAttendue.length === 0) return new Set();

  const deptApplicables = await prisma.chantier_territoire.findMany({
    where: {
      id: { in: chantierIdsCibleAttendue },
      maille: "DEPT",
      est_applicable: true,
    },
    select: {
      id: true,
      chantier_territoire_jalon: {
        where: { jalon: jalonParDefaut },
        select: { taux_avancement: true },
      },
    },
  });

  const chantiersAvecTaux = new Set(
    deptApplicables
      .filter((dept) =>
        dept.chantier_territoire_jalon.some(
          (jalon) => jalon.taux_avancement !== null,
        ),
      )
      .map((dept) => dept.id),
  );

  const chantiersAvecDept = new Set(deptApplicables.map((dept) => dept.id));

  const result = new Set<string>();
  for (const chantierId of chantierIdsCibleAttendue) {
    if (!chantiersAvecDept.has(chantierId)) continue;
    if (!chantiersAvecTaux.has(chantierId)) result.add(chantierId);
  }
  return result;
}
