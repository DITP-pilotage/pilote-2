import { Inject } from "@/server/chantiers/module";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import type { ChantierTerritoireSignale } from "./ChantiersSignalesDataFetcher";

export class GetChantiersSignalesQuery {
  constructor(private readonly deps: Inject<"chantiersSignalesDataFetcher">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCode: string;
    jalonParDefaut: number;
  }): Promise<ChantiersSignalesContrat> {
    const chantierTerritoires =
      await this.deps.chantiersSignalesDataFetcher.recupererChantierTerritoires(
        {
          chantierIds: params.chantierIds,
          territoireCode: params.territoireCode,
          jalon: params.jalonParDefaut,
        },
      );

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);
    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const pvaChantierIds =
      await this.deps.chantiersSignalesDataFetcher.recupererPvaIds(
        maille,
        chantierIdsApplicables,
        params.territoireCode,
      );

    const { chantiersAvecDept, chantiersAvecTaux } =
      await this.deps.chantiersSignalesDataFetcher.recupererAbsenceTauxDepartementalSets(
        maille,
        chantierTerritoires,
        params.jalonParDefaut,
      );

    const absenceTauxDeptCount = this.compterAbsenceTauxDepartemental(
      chantierTerritoires,
      chantiersAvecDept,
      chantiersAvecTaux,
    );

    return this.agregerCompteurs(
      chantierTerritoires,
      maille,
      pvaChantierIds,
      absenceTauxDeptCount,
    );
  }

  private compterAbsenceTauxDepartemental(
    chantierTerritoires: ChantierTerritoireSignale[],
    chantiersAvecDept: Set<string>,
    chantiersAvecTaux: Set<string>,
  ): number {
    let count = 0;
    for (const ct of chantierTerritoires) {
      if (!ct.chantier_identite.cible_attendue) continue;
      if (!chantiersAvecDept.has(ct.id)) continue;
      if (!chantiersAvecTaux.has(ct.id)) count++;
    }
    return count;
  }

  private agregerCompteurs(
    chantierTerritoires: ChantierTerritoireSignale[],
    maille: string,
    pvaChantierIds: Set<string>,
    absenceTauxDeptCount: number,
  ): ChantiersSignalesContrat {
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
