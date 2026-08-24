import { $Enums } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import Loader from "@/components/_commons/Loader/Loader";
import { Lien } from "@/components/_commons/Lien/Lien";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import type { PorteurAdminListItem } from "@/server/metadataPorteur/queries/ListerPorteursAdminQuery";

const TYPE_BADGE: Record<
  $Enums.porteur_type,
  { label: string; className: string }
> = {
  MIN: {
    label: "Ministère",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  },
  DAC: {
    label: "DAC",
    className: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  },
  DI: {
    label: "DI",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  AUTRE: {
    label: "Autre",
    className: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
  },
};

const LignePorteur = ({ porteur }: { porteur: PorteurAdminListItem }) => {
  const router = useRouter();
  const supprimé = porteur.deletedAt !== null;
  const typeBadge =
    porteur.porteurType && porteur.porteurType in TYPE_BADGE
      ? TYPE_BADGE[porteur.porteurType]
      : null;
  return (
    <tr
      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
      onClick={() =>
        router.push(
          `/panel-administrateur/referentiels/porteurs/${porteur.porteurId}`,
        )
      }
    >
      <td className="px-6 py-4 font-mono text-xs text-gray-400">
        {porteur.porteurId}
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">
        {porteur.porteurShort}
      </td>
      <td className="px-6 py-4 text-gray-700">
        <span className={supprimé ? "line-through text-gray-400" : ""}>
          {porteur.porteurName}
        </span>
      </td>
      <td className="px-6 py-4">
        {typeBadge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.className}`}
          >
            {typeBadge.label}
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <BadgeStatutReferentiel supprimé={supprimé} />
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
        {new Date(porteur.updatedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
    </tr>
  );
};

const PageAdminPorteurs = () => {
  const router = useRouter();
  const { data: porteurs, isLoading } = api.metadataPorteur.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const porteursFiltres = porteurs?.filter((porteur) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      porteur.porteurId.toLowerCase().includes(q) ||
      porteur.porteurShort.toLowerCase().includes(q) ||
      porteur.porteurName.toLowerCase().includes(q)
    );
  });

  const succès = router.query._action === "creation-reussie";

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Porteur créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Porteurs</h1>
            {!isLoading && porteurs && (
              <p className="mt-1 text-sm text-gray-500">
                {porteurs.length} porteur{porteurs.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels/porteurs/nouveau?_action=creer-porteur"
            label="+ Créer un porteur"
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
          ) : porteursFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun porteur"}
              </p>
              {recherche && (
                <p className="text-sm mt-1">
                  Aucun porteur ne correspond à «&nbsp;{recherche}&nbsp;».
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
                    Sigle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
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
                {porteursFiltres?.map((porteur) => (
                  <LignePorteur key={porteur.porteurId} porteur={porteur} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAdminPorteurs;
