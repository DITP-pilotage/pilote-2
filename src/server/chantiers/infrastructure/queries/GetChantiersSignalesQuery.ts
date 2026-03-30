import { Inject } from "@/server/chantiers/module";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

export class GetChantiersSignalesQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCode: string;
    jalonParDefaut: number;
  }): Promise<ChantiersSignalesContrat> {
    const prisma = this.deps.prisma.getInstance();

    const baseWhere = {
      territoire_code: params.territoireCode,
      est_applicable: true,
      chantier_identite: {
        NOT: { ministeres: { isEmpty: true } },
      },
      id: { in: params.chantierIds },
    } as const;

    const chantierTerritoires = await prisma.chantier_territoire.findMany({
      where: baseWhere,
      select: {
        id: true,
        meteo: true,
        tendance: true,
        nombre_propositions_valeur_actuelle: true,
        maille: true,
        chantier_identite: {
          select: {
            cible_attendue: true,
          },
        },
        chantier_territoire_jalon: {
          where: { jalon: params.jalonParDefaut },
          select: {
            ecart: true,
            taux_avancement: true,
          },
        },
      },
    });

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);

    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    // PVA : agréger les territoires enfants (dept+reg pour NAT, dept pour REG, aucun pour DEPT)
    let pvaChantierIds = new Set<string>();
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
      pvaChantierIds = new Set(enfants.map((e) => e.id));
    } else if (maille === "REG") {
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
      pvaChantierIds = new Set(enfants.map((e) => e.id));
    }

    // Absence taux avancement départemental (uniquement pertinent au national)
    let absenceTauxDeptCount = 0;
    if (maille === "NAT") {
      const chantierIdsCibleAttendue = chantierTerritoires
        .filter((ct) => ct.chantier_identite.cible_attendue)
        .map((ct) => ct.id);

      if (chantierIdsCibleAttendue.length > 0) {
        const deptApplicables = await prisma.chantier_territoire.findMany({
          where: {
            id: { in: chantierIdsCibleAttendue },
            maille: "DEPT",
            est_applicable: true,
          },
          select: {
            id: true,
            chantier_territoire_jalon: {
              where: { jalon: params.jalonParDefaut },
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

        const chantiersAvecDept = new Set(
          deptApplicables.map((dept) => dept.id),
        );

        for (const chantierId of chantierIdsCibleAttendue) {
          if (!chantiersAvecDept.has(chantierId)) continue;
          if (!chantiersAvecTaux.has(chantierId)) {
            absenceTauxDeptCount++;
          }
        }
      }
    }

    let ecart = 0;
    let baisse = 0;
    let tauxNonCalcule = 0;
    let meteoNonRenseignee = 0;
    let pva = 0;

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];

      if (jalonData?.ecart !== null && jalonData?.ecart !== undefined) {
        if (jalonData.ecart < -10) ecart++;
      }

      if (ct.tendance === "BAISSE") baisse++;

      if (
        ct.chantier_identite.cible_attendue &&
        (jalonData?.taux_avancement === null ||
          jalonData?.taux_avancement === undefined)
      ) {
        tauxNonCalcule++;
      }

      if (ct.meteo === "NON_RENSEIGNEE" || ct.meteo === null)
        meteoNonRenseignee++;

      if (maille === "DEPT") {
        if (ct.nombre_propositions_valeur_actuelle > 0) pva++;
      } else {
        if (pvaChantierIds.has(ct.id)) pva++;
      }
    }

    return {
      estEnAlerteÉcart: ecart,
      estEnAlerteBaisse: baisse,
      estEnAlerteTauxAvancementNonCalculé: tauxNonCalcule,
      estEnAlerteAbscenceTauxAvancementDepartemental: absenceTauxDeptCount,
      estEnAlerteMétéoNonRenseignée: meteoNonRenseignee,
      estEnAlertePossedePropositionsValeurAvancement: pva,
    };
  }
}
