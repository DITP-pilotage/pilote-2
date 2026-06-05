import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import {
  AlbertDashboardFilters,
  type FiltresDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters";
import {
  AlbertDashboardTable,
  type TriDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardTable";
import { ConversationDetailModale } from "@/components/PagePanelAdministrateur/Albert/ConversationDetailModale";

const TAILLE_PAGE = 25;

const champsTri = ["createdAt", "updatedAt"] as const;
const directionsTri = ["asc", "desc"] as const;
const categoriesProbleme = Object.values($Enums.llm_call_categorie_probleme);

export const AlbertDashboard = () => {
  const [params, setParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      recherche: parseAsString.withDefault(""),
      avecPouce: parseAsBoolean.withDefault(false),
      avecPouceBas: parseAsBoolean.withDefault(false),
      avecCommentaire: parseAsBoolean.withDefault(false),
      categories: parseAsArrayOf(
        parseAsStringLiteral(categoriesProbleme),
      ).withDefault([]),
      profilCodes: parseAsArrayOf(parseAsString).withDefault([]),
      triChamp: parseAsStringLiteral(champsTri).withDefault("updatedAt"),
      triDirection: parseAsStringLiteral(directionsTri).withDefault("desc"),
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

  const tri: TriDashboard = {
    champ: params.triChamp,
    direction: params.triDirection,
  };

  const { data, isLoading } = api.albert.conversations.listerToutes.useQuery({
    page: params.page,
    taillePage: TAILLE_PAGE,
    recherche: filtres.recherche || undefined,
    avecPouce: filtres.avecPouce || undefined,
    avecPouceBas: filtres.avecPouceBas || undefined,
    avecCommentaire: filtres.avecCommentaire || undefined,
    categories: filtres.categories.length > 0 ? filtres.categories : undefined,
    profilCodes:
      filtres.profilCodes.length > 0 ? filtres.profilCodes : undefined,
    triChamp: tri.champ,
    triDirection: tri.direction,
  });

  const changerFiltres = (nouveauxFiltres: FiltresDashboard) => {
    setParams({
      page: 1,
      recherche: nouveauxFiltres.recherche,
      avecPouce: nouveauxFiltres.avecPouce,
      avecPouceBas: nouveauxFiltres.avecPouceBas,
      avecCommentaire: nouveauxFiltres.avecCommentaire,
      categories: nouveauxFiltres.categories,
      profilCodes: nouveauxFiltres.profilCodes,
    });
  };

  const changerTri = (nouveauTri: TriDashboard) => {
    setParams({
      page: 1,
      triChamp: nouveauTri.champ,
      triDirection: nouveauTri.direction,
    });
  };

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
        onLigneClick={(id) => setParams({ conversationOuverteId: id })}
        onPageChange={(page) => setParams({ page })}
        onTriChange={changerTri}
        page={params.page}
        taillePage={TAILLE_PAGE}
        total={data?.total ?? 0}
        tri={tri}
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
