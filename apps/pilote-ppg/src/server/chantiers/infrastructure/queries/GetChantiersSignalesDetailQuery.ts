import { Inject } from "@/server/chantiers/module";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { estEnAlerteTypeAlerte } from "@/server/chantiers/domain/estEnAlerteTypeAlerte";
import type { ChantierTerritoireSignale } from "./ChantiersSignalesDataFetcher";

export type ChantierSignale = {
  id: string;
  nom: string;
  meteo: string | null;
  ecart: number | null;
  typesAlerte: TypeAlerteChantier[];
};

export type GetChantiersSignalesDetailResult = ChantierSignale[];

export class GetChantiersSignalesDetailQuery {
  constructor(private readonly deps: Inject<"chantiersSignalesDataFetcher">) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
    chantierIds: string[];
    typesAlerte: TypeAlerteChantier[];
  }): Promise<GetChantiersSignalesDetailResult> {
    const chantierTerritoires =
      await this.deps.chantiersSignalesDataFetcher.recupererChantierTerritoires(
        {
          chantierIds: params.chantierIds,
          territoireCode: params.territoireCode,
          jalon: params.jalon,
          statutPublieUniquement: true,
        },
      );

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);

    const pvaIds = await this.résoudrePvaIds(
      params.typesAlerte,
      maille,
      chantierTerritoires,
      params.territoireCode,
    );

    const { chantiersAvecDept, chantiersAvecTaux } =
      await this.résoudreAbsenceTauxDepartementalSets(
        params.typesAlerte,
        maille,
        chantierTerritoires,
        params.jalon,
      );

    return this.construireResultats(
      chantierTerritoires,
      maille,
      params.typesAlerte,
      { pvaIds, chantiersAvecDept, chantiersAvecTaux },
    );
  }

  private async résoudrePvaIds(
    typesAlerte: TypeAlerteChantier[],
    maille: string,
    chantierTerritoires: ChantierTerritoireSignale[],
    territoireCode: string,
  ): Promise<Set<string>> {
    if (!typesAlerte.includes("estEnAlertePossedePropositionsValeurAvancement"))
      return new Set<string>();

    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);
    return this.deps.chantiersSignalesDataFetcher.recupererPvaIds(
      maille,
      chantierIdsApplicables,
      territoireCode,
    );
  }

  private async résoudreAbsenceTauxDepartementalSets(
    typesAlerte: TypeAlerteChantier[],
    maille: string,
    chantierTerritoires: ChantierTerritoireSignale[],
    jalon: number,
  ): Promise<{
    chantiersAvecDept: Set<string>;
    chantiersAvecTaux: Set<string>;
  }> {
    if (
      !typesAlerte.includes("estEnAlerteAbscenceTauxAvancementDepartemental")
    ) {
      return {
        chantiersAvecDept: new Set<string>(),
        chantiersAvecTaux: new Set<string>(),
      };
    }

    return this.deps.chantiersSignalesDataFetcher.recupererAbsenceTauxDepartementalSets(
      maille,
      chantierTerritoires,
      jalon,
    );
  }

  private construireResultats(
    chantierTerritoires: ChantierTerritoireSignale[],
    maille: string,
    typesAlerte: TypeAlerteChantier[],
    contexteAlertesTransverses: {
      pvaIds: Set<string>;
      chantiersAvecDept: Set<string>;
      chantiersAvecTaux: Set<string>;
    },
  ): ChantierSignale[] {
    const resultats: ChantierSignale[] = [];

    for (const chantierTerritoire of chantierTerritoires) {
      const jalonData = chantierTerritoire.chantier_territoire_jalon[0];
      const ecart = jalonData?.ecart ?? null;
      const tauxAvancement = jalonData?.taux_avancement ?? null;

      const typesAlerteMatches = typesAlerte.filter((typeAlerte) =>
        estEnAlerteTypeAlerte(typeAlerte, {
          chantierTerritoire,
          maille,
          ecart,
          tauxAvancement,
          ...contexteAlertesTransverses,
        }),
      );

      if (typesAlerteMatches.length === 0) continue;

      resultats.push({
        id: chantierTerritoire.id,
        nom: `${chantierTerritoire.id} — ${chantierTerritoire.chantier_identite.nom}`,
        meteo: chantierTerritoire.meteo,
        ecart,
        typesAlerte: typesAlerteMatches,
      });
    }

    return resultats;
  }
}
