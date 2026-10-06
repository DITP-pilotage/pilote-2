import { useCallback } from "react";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { $Enums } from "@prisma/client";
import {
  parseAsSortingAmong,
  parseAsTablePage,
} from "@/components/shared/DataTable/urlParsers";
import { api } from "@/server/framework/trpc/api";
import {
  AlbertDashboardFilters,
  type FiltresDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters";
import {
  AlbertDashboardTable,
  CHAMPS_TRI_ALBERT,
  TAILLE_PAGE_ALBERT,
  TRI_ALBERT_PAR_DEFAUT,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardTable";
import { ConversationDetailModale } from "@/components/PagePanelAdministrateur/Albert/ConversationDetailModale";

const categoriesProbleme = Object.values($Enums.llm_call_categorie_probleme);

export const AlbertDashboard = () => {
  const [params, setParams] = useQueryStates(
    {
      page: parseAsTablePage,
      recherche: parseAsString.withDefault(""),
      avecPouce: parseAsBoolean.withDefault(false),
      avecPouceBas: parseAsBoolean.withDefault(false),
      avecCommentaire: parseAsBoolean.withDefault(false),
      categories: parseAsArrayOf(
        parseAsStringLiteral(categoriesProbleme),
      ).withDefault([]),
      profilCodes: parseAsArrayOf(parseAsString).withDefault([]),
      sort: parseAsSortingAmong(CHAMPS_TRI_ALBERT).withDefault([
        TRI_ALBERT_PAR_DEFAUT,
      ]),
      conversationOuverteId: parseAsString,
    },
    { history: "push", shallow: false, clearOnDefault: true },
  );

  const filtres: FiltresDashboard = {
    recherche: params.recherche,
    avecPouce: params.avecPouce,
    avecPouceBas: params.avecPouceBas,
    avecCommentaire: params.avecCommentaire,
    categories: params.categories,
    profilCodes: params.profilCodes,
  };

  const [tri = TRI_ALBERT_PAR_DEFAUT] = params.sort;

  const { data, isLoading } = api.albert.conversations.listerToutes.useQuery({
    page: params.page + 1,
    taillePage: TAILLE_PAGE_ALBERT,
    recherche: filtres.recherche || undefined,
    avecPouce: filtres.avecPouce || undefined,
    avecPouceBas: filtres.avecPouceBas || undefined,
    avecCommentaire: filtres.avecCommentaire || undefined,
    categories: filtres.categories.length > 0 ? filtres.categories : undefined,
    profilCodes:
      filtres.profilCodes.length > 0 ? filtres.profilCodes : undefined,
    triChamp: tri.id,
    triDirection: tri.desc ? "desc" : "asc",
  });

  const changerFiltres = (nouveauxFiltres: FiltresDashboard) => {
    setParams({
      page: 0,
      recherche: nouveauxFiltres.recherche,
      avecPouce: nouveauxFiltres.avecPouce,
      avecPouceBas: nouveauxFiltres.avecPouceBas,
      avecCommentaire: nouveauxFiltres.avecCommentaire,
      categories: nouveauxFiltres.categories,
      profilCodes: nouveauxFiltres.profilCodes,
    });
  };

  const ouvrirConversation = useCallback(
    (id: string) => setParams({ conversationOuverteId: id }),
    [setParams],
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-dsfr-grey-50 mb-1">
        Dashboard Albert
      </h2>
      <p className="text-sm text-dsfr-mention-grey mb-4">
        Liste de toutes les conversations Albert et leurs feedbacks.
      </p>

      <AlbertDashboardFilters filtres={filtres} onChange={changerFiltres} />

      <AlbertDashboardTable
        conversations={data?.items ?? []}
        enChargement={isLoading}
        onLigneClick={ouvrirConversation}
        total={data?.total ?? 0}
      />

      {params.conversationOuverteId && (
        <ConversationDetailModale
          id={params.conversationOuverteId}
          onClose={() => setParams({ conversationOuverteId: null })}
        />
      )}
    </div>
  );
};
