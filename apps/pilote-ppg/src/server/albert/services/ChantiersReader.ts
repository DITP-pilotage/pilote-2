import type {
  GetChantiersParams,
  GetChantiersQuery,
  GetChantiersResult,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

export type ReadChantiersParams = {
  territoireCode: string;
  jalon: number;
  includeSousTerritoires: boolean;
  chantierIds?: string[];
  view?: "all" | "en_retard" | "en_difficulte";
  tendance?: "HAUSSE" | "BAISSE" | "STAGNATION";
  meteo?: "SOLEIL" | "COUVERT" | "NUAGE" | "ORAGE";
};

export type AccessScope = {
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
};

export type ReadChantiersResult =
  | {
      kind: "resultats";
      resultats: GetChantiersResult[];
      restrictedTerritoires: string[];
    }
  | { kind: "notApplicable"; raison: string }
  | { kind: "requestedChantiersNotAccessible" }
  | { kind: "noChantierAccessible" };

export const NON_APPLICABLE_EN_RETARD_NAT_FR =
  "L'analyse des chantiers en retard ne peut pas être réalisée au niveau national.\n\nEn effet, cet indicateur repose sur une comparaison entre le taux d'avancement d'un chantier pour un territoire donné et la valeur médiane observée sur l'ensemble des autres territoires.";

const TERRITOIRE_NATIONAL = "NAT-FR";

function toQueryParams(
  params: ReadChantiersParams,
  territoireCode: string,
  chantierIds: string[],
): GetChantiersParams {
  return {
    territoireCode,
    jalon: params.jalon,
    chantierIds,
    view: params.view,
    tendance: params.tendance,
    meteo: params.meteo,
  };
}

function maskRestrictedData(resultat: GetChantiersResult): GetChantiersResult {
  return {
    ...resultat,
    chantiers: resultat.chantiers.map((chantier) => ({
      ...chantier,
      tendance: null,
      est_en_retard: false,
      est_en_difficulte: false,
      synthese: chantier.synthese
        ? {
            meteo: chantier.synthese.meteo,
            commentaire: null,
            date_meteo: chantier.synthese.date_meteo,
            date_commentaire: null,
          }
        : null,
      commentaires: { donnees: null, autresResultats: null },
    })),
  };
}

export class ChantiersReader {
  constructor(
    private readonly deps: {
      getChantiersQuery: GetChantiersQuery;
      territoireResolver: TerritoireResolver;
    },
  ) {}

  async execute(
    params: ReadChantiersParams,
    access: AccessScope,
  ): Promise<ReadChantiersResult> {
    if (
      params.territoireCode === TERRITOIRE_NATIONAL &&
      params.view === "en_retard" &&
      !params.includeSousTerritoires
    ) {
      return { kind: "notApplicable", raison: NON_APPLICABLE_EN_RETARD_NAT_FR };
    }

    const chantiersDemandes =
      params.chantierIds && params.chantierIds.length > 0
        ? params.chantierIds
        : undefined;

    // Une liste vide n'est pas filtrée par la query : le cas sans aucun
    // chantier accessible doit donc s'arrêter ici.
    const chantierIds = (
      chantiersDemandes ?? access.chantiersAccessibles
    ).filter((id) => access.chantiersAccessibles.includes(id));

    if (chantierIds.length === 0) {
      return chantiersDemandes
        ? { kind: "requestedChantiersNotAccessible" }
        : { kind: "noChantierAccessible" };
    }

    const codes = await this.deps.territoireResolver.resoudre(
      params.territoireCode,
      params.includeSousTerritoires,
    );

    const resultats = await Promise.all(
      codes.map((code) =>
        this.deps.getChantiersQuery.execute(
          toQueryParams(params, code, chantierIds),
        ),
      ),
    );

    const estAccessible = (resultat: GetChantiersResult) =>
      access.territoiresAccessibles.includes(resultat.territoire_code);

    return {
      kind: "resultats",
      resultats: resultats.map((resultat) =>
        estAccessible(resultat) ? resultat : maskRestrictedData(resultat),
      ),
      restrictedTerritoires: [
        ...new Set(
          resultats
            .filter((resultat) => !estAccessible(resultat))
            .map((resultat) => resultat.territoire_code),
        ),
      ],
    };
  }
}
