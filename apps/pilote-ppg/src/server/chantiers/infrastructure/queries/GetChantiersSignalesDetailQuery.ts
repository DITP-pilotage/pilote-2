import { Inject } from "@/server/chantiers/module";
import { CategorieAlerteChantier } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { estEnAlerteCategorie } from "./estEnAlerteCategorie";

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
    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const pvaIds = params.categories.includes("pva")
      ? await this.deps.chantiersSignalesDataFetcher.recupererPvaIds(
          maille,
          chantierIdsApplicables,
          params.territoireCode,
        )
      : new Set<string>();

    const { chantiersAvecDept, chantiersAvecTaux } =
      params.categories.includes("absence_taux_departemental")
        ? await this.deps.chantiersSignalesDataFetcher.recupererAbsenceTauxDepartementalSets(
            maille,
            chantierTerritoires,
            params.jalon,
          )
        : {
            chantiersAvecDept: new Set<string>(),
            chantiersAvecTaux: new Set<string>(),
          };

    const resultats: ChantierSignale[] = [];

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];
      const ecart = jalonData?.ecart ?? null;
      const tauxAvancement = jalonData?.taux_avancement ?? null;

      const categoriesMatchees = params.categories.filter((categorie) =>
        estEnAlerteCategorie(categorie, {
          ct,
          maille,
          ecart,
          tauxAvancement,
          pvaIds,
          chantiersAvecDept,
          chantiersAvecTaux,
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
