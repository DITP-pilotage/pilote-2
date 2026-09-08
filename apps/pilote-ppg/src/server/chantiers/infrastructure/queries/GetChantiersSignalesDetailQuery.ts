import { Inject } from "@/server/chantiers/module";
import { CategorieAlerteChantier } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { estEnAlerteCategorie } from "@/server/chantiers/domain/estEnAlerteCategorie";
import type { ChantierTerritoireSignale } from "./ChantiersSignalesDataFetcher";

export type ChantierSignale = {
  id: string;
  nom: string;
  meteo: string | null;
  ecart: number | null;
  categories: CategorieAlerteChantier[];
};

export type GetChantiersSignalesDetailResult = ChantierSignale[];

export class GetChantiersSignalesDetailQuery {
  constructor(private readonly deps: Inject<"chantiersSignalesDataFetcher">) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
    chantierIds: string[];
    categories: CategorieAlerteChantier[];
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
      params.categories,
      maille,
      chantierTerritoires,
      params.territoireCode,
    );

    const { chantiersAvecDept, chantiersAvecTaux } =
      await this.résoudreAbsenceTauxDepartementalSets(
        params.categories,
        maille,
        chantierTerritoires,
        params.jalon,
      );

    return this.construireResultats(
      chantierTerritoires,
      maille,
      params.categories,
      { pvaIds, chantiersAvecDept, chantiersAvecTaux },
    );
  }

  private async résoudrePvaIds(
    categories: CategorieAlerteChantier[],
    maille: string,
    chantierTerritoires: ChantierTerritoireSignale[],
    territoireCode: string,
  ): Promise<Set<string>> {
    if (!categories.includes("pva")) return new Set<string>();

    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);
    return this.deps.chantiersSignalesDataFetcher.recupererPvaIds(
      maille,
      chantierIdsApplicables,
      territoireCode,
    );
  }

  private async résoudreAbsenceTauxDepartementalSets(
    categories: CategorieAlerteChantier[],
    maille: string,
    chantierTerritoires: ChantierTerritoireSignale[],
    jalon: number,
  ): Promise<{
    chantiersAvecDept: Set<string>;
    chantiersAvecTaux: Set<string>;
  }> {
    if (!categories.includes("absence_taux_departemental")) {
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
    categories: CategorieAlerteChantier[],
    contexteAlertesTransverses: {
      pvaIds: Set<string>;
      chantiersAvecDept: Set<string>;
      chantiersAvecTaux: Set<string>;
    },
  ): ChantierSignale[] {
    const resultats: ChantierSignale[] = [];

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];
      const ecart = jalonData?.ecart ?? null;
      const tauxAvancement = jalonData?.taux_avancement ?? null;

      const categoriesMatchees = categories.filter((categorie) =>
        estEnAlerteCategorie(categorie, {
          ct,
          maille,
          ecart,
          tauxAvancement,
          ...contexteAlertesTransverses,
        }),
      );

      if (categoriesMatchees.length === 0) continue;

      resultats.push({
        id: ct.id,
        nom: `${ct.id} — ${ct.chantier_identite.nom}`,
        meteo: ct.meteo,
        ecart,
        categories: categoriesMatchees,
      });
    }

    return resultats;
  }
}
