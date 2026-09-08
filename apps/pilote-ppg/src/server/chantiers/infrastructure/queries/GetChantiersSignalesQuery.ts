import { Inject } from "@/server/chantiers/module";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import { CATEGORIES_ALERTE_CHANTIER } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { estEnAlerteCategorie } from "./estEnAlerteCategorie";
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

    const pvaIds = await this.deps.chantiersSignalesDataFetcher.recupererPvaIds(
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

    return this.agregerCompteurs(
      chantierTerritoires,
      maille,
      pvaIds,
      chantiersAvecDept,
      chantiersAvecTaux,
    );
  }

  private agregerCompteurs(
    chantierTerritoires: ChantierTerritoireSignale[],
    maille: string,
    pvaIds: Set<string>,
    chantiersAvecDept: Set<string>,
    chantiersAvecTaux: Set<string>,
  ): ChantiersSignalesContrat {
    const compteurs = Object.fromEntries(
      CATEGORIES_ALERTE_CHANTIER.map(({ typeAlerte }) => [typeAlerte, 0]),
    ) as ChantiersSignalesContrat;

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];
      const ecart = jalonData?.ecart ?? null;
      const tauxAvancement = jalonData?.taux_avancement ?? null;

      for (const { categorie, typeAlerte } of CATEGORIES_ALERTE_CHANTIER) {
        const enAlerte = estEnAlerteCategorie(categorie, {
          ct,
          maille,
          ecart,
          tauxAvancement,
          pvaIds,
          chantiersAvecDept,
          chantiersAvecTaux,
        });

        if (enAlerte) compteurs[typeAlerte]++;
      }
    }

    return compteurs;
  }
}
