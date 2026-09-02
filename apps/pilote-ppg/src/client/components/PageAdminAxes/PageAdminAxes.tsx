import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import Loader from "@/components/_commons/Loader/Loader";
import { Lien } from "@/components/_commons/Lien/Lien";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import type { AxeAdminListItem } from "@/server/metadataAxe/queries/ListerAxesAdminQuery";

const LigneAxe = ({ axe }: { axe: AxeAdminListItem }) => {
  const router = useRouter();
  const supprimé = axe.deletedAt !== null;
  return (
    <tr
      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
      onClick={() =>
        router.push(
          `/panel-administrateur/referentiels-deprecies/axes/${axe.axeId}`,
        )
      }
    >
      <td className="px-6 py-4 font-mono text-xs text-gray-400">{axe.axeId}</td>
      <td className="px-6 py-4 text-gray-700">
        <span className={supprimé ? "line-through text-gray-400" : ""}>
          {axe.axeName}
        </span>
      </td>
      <td className="px-6 py-4">
        <BadgeStatutReferentiel supprimé={supprimé} />
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
        {new Date(axe.updatedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
    </tr>
  );
};

const PageAdminAxes = () => {
  const router = useRouter();
  const { data: axes, isLoading } = api.metadataAxe.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const axesFiltres = axes?.filter((axe) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      axe.axeId.toLowerCase().includes(q) ||
      axe.axeName.toLowerCase().includes(q)
    );
  });

  const succès = router.query._action === "creation-reussie";

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Axe créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels dépréciés
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Axes</h1>
            {!isLoading && axes && (
              <p className="mt-1 text-sm text-gray-500">
                {axes.length} axe{axes.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels-deprecies/axes/nouveau?_action=creer-axe"
            label="+ Créer un axe"
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
          ) : axesFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun axe"}
              </p>
              {recherche && (
                <p className="text-sm mt-1">
                  Aucun axe ne correspond à «&nbsp;{recherche}&nbsp;».
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
                {axesFiltres?.map((axe) => (
                  <LigneAxe axe={axe} key={axe.axeId} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAdminAxes;
