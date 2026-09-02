import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import Loader from "@/components/_commons/Loader/Loader";
import { Lien } from "@/components/_commons/Lien/Lien";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { formaterDateCourte } from "@/client/utils/date/date";
import type { EngagementAdminListItem } from "@/server/metadataEngagement/queries/ListerEngagementsAdminQuery";

const LigneEngagement = ({
  engagement,
}: {
  engagement: EngagementAdminListItem;
}) => {
  const router = useRouter();
  const supprimé = engagement.deletedAt !== null;
  return (
    <tr
      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
      onClick={() =>
        router.push(
          `/panel-administrateur/referentiels-deprecies/engagements/${engagement.engagementId}`,
        )
      }
    >
      <td className="px-6 py-4 font-mono text-xs text-gray-400">
        {engagement.engagementId}
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">
        {engagement.engagementShort}
      </td>
      <td className="px-6 py-4 text-gray-700">
        <span className={supprimé ? "line-through text-gray-400" : ""}>
          {engagement.engagementName}
        </span>
      </td>
      <td className="px-6 py-4">
        <BadgeStatutReferentiel supprimé={supprimé} />
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
        {formaterDateCourte(new Date(engagement.updatedAt))}
      </td>
    </tr>
  );
};

const PageAdminEngagements = () => {
  const router = useRouter();
  const { data: engagements, isLoading } =
    api.metadataEngagement.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const engagementsFiltres = engagements?.filter((engagement) => {
    const termeRecherche = recherche.toLowerCase().trim();
    if (!termeRecherche) return true;
    return (
      engagement.engagementId.toLowerCase().includes(termeRecherche) ||
      engagement.engagementShort.toLowerCase().includes(termeRecherche) ||
      engagement.engagementName.toLowerCase().includes(termeRecherche)
    );
  });

  const succès = router.query._action === "creation-reussie";

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Engagement créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels dépréciés
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Engagements</h1>
            {!isLoading && engagements && (
              <p className="mt-1 text-sm text-gray-500">
                {engagements.length} engagement
                {engagements.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels-deprecies/engagements/nouveau?_action=creer-engagement"
            label="+ Créer un engagement"
            variant="button"
          />
        </div>

        <div className="mb-4 max-w-sm">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              setRecherche(event.target.value)
            }
            valeur={recherche}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="relative py-20">
              <Loader />
            </div>
          ) : engagementsFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun engagement"}
              </p>
              {recherche && (
                <p className="text-sm mt-1">
                  Aucun engagement ne correspond à «&nbsp;{recherche}&nbsp;».
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mise à jour
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {engagementsFiltres?.map((engagement) => (
                  <LigneEngagement
                    engagement={engagement}
                    key={engagement.engagementId}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAdminEngagements;
