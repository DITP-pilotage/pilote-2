import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import {
  AlbertDashboardFilters,
  FILTRES_VIDES,
  type FiltresDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters";
import {
  AlbertDashboardTable,
  type TriDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardTable";
import { ConversationDetailModale } from "@/components/PagePanelAdministrateur/Albert/ConversationDetailModale";

const TAILLE_PAGE = 25;

export const AlbertDashboard = () => {
  const [filtres, setFiltres] = useState<FiltresDashboard>(FILTRES_VIDES);
  const [page, setPage] = useState(1);
  const [tri, setTri] = useState<TriDashboard>({
    champ: "updatedAt",
    direction: "desc",
  });
  const [conversationOuverteId, setConversationOuverteId] = useState<
    string | null
  >(null);

  const { data, isLoading } = api.albert.admin.listerConversations.useQuery({
    page,
    taillePage: TAILLE_PAGE,
    recherche: filtres.recherche || undefined,
    avecPouce: filtres.avecPouce || undefined,
    avecPouceBas: filtres.avecPouceBas || undefined,
    avecCommentaire: filtres.avecCommentaire || undefined,
    profilCodes:
      filtres.profilCodes.length > 0 ? filtres.profilCodes : undefined,
    triChamp: tri.champ,
    triDirection: tri.direction,
  });

  const changerFiltres = (nouveauxFiltres: FiltresDashboard) => {
    setFiltres(nouveauxFiltres);
    setPage(1);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Liste de toutes les conversations Albert et leurs feedbacks.
      </p>

      <AlbertDashboardFilters filtres={filtres} onChange={changerFiltres} />

      <AlbertDashboardTable
        conversations={data?.items ?? []}
        enChargement={isLoading}
        onLigneClick={setConversationOuverteId}
        onPageChange={setPage}
        onTriChange={(nouveauTri) => {
          setTri(nouveauTri);
          setPage(1);
        }}
        page={page}
        taillePage={TAILLE_PAGE}
        total={data?.total ?? 0}
        tri={tri}
      />

      {conversationOuverteId && (
        <ConversationDetailModale
          id={conversationOuverteId}
          onClose={() => setConversationOuverteId(null)}
        />
      )}
    </div>
  );
};
