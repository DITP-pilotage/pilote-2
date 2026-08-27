import { Inject } from "@/server/chantiers/module";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import {
  aEcartEnRetard,
  aMeteoNonRenseignee,
  aTauxNonCalcule,
  aTendanceEnBaisse,
  ChantierTerritoireAvecJalon,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";
import {
  chantiersSansTauxDepartemental,
  compterPva,
} from "@/server/chantiers/infrastructure/queries/RequetesCategoriesSignalement";

export class GetChantiersSignalesQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCode: string;
    jalonParDefaut: number;
  }): Promise<ChantiersSignalesContrat> {
    const prisma = this.deps.prisma.getInstance();

    const chantierTerritoires = await this.recupererChantierTerritoires(
      prisma,
      params,
    );

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);
    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const pvaChantierIds = await compterPva(
      prisma,
      maille,
      chantierIdsApplicables,
      params,
    );

    const absenceTauxDeptIds = await chantiersSansTauxDepartemental(
      prisma,
      maille,
      chantierTerritoires,
      params.jalonParDefaut,
    );

    return this.agregerCompteurs(
      chantierTerritoires,
      maille,
      pvaChantierIds,
      absenceTauxDeptIds,
    );
  }

  private async recupererChantierTerritoires(
    prisma: PilotePrismaClient,
    params: {
      chantierIds: string[];
      territoireCode: string;
      jalonParDefaut: number;
    },
  ) {
    return prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
        },
        id: { in: params.chantierIds },
      },
      select: {
        id: true,
        meteo: true,
        tendance: true,
        nombre_propositions_valeur_actuelle: true,
        chantier_identite: {
          select: { cible_attendue: true },
        },
        chantier_territoire_jalon: {
          where: { jalon: params.jalonParDefaut },
          select: { ecart: true, taux_avancement: true },
        },
      },
    });
  }

  private agregerCompteurs(
    chantierTerritoires: ChantierTerritoireAvecJalon[],
    maille: string,
    pvaChantierIds: Set<string>,
    absenceTauxDeptIds: Set<string>,
  ): ChantiersSignalesContrat {
    let ecart = 0;
    let baisse = 0;
    let tauxNonCalcule = 0;
    let meteoNonRenseignee = 0;
    let pva = 0;

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];

      if (aEcartEnRetard(jalonData?.ecart)) ecart++;

      if (aTendanceEnBaisse(ct.tendance)) baisse++;

      if (
        aTauxNonCalcule(
          ct.chantier_identite.cible_attendue,
          jalonData?.taux_avancement,
        )
      ) {
        tauxNonCalcule++;
      }

      if (aMeteoNonRenseignee(ct.meteo)) meteoNonRenseignee++;

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
      estEnAlerteAbscenceTauxAvancementDepartemental: absenceTauxDeptIds.size,
      estEnAlerteMétéoNonRenseignée: meteoNonRenseignee,
      estEnAlertePossedePropositionsValeurAvancement: pva,
    };
  }
}
