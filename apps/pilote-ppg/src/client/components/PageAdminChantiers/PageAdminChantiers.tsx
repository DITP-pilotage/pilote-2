import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import AlerteMetadataChantier from "@/components/PageAdminChantiers/AlerteMetadataChantier";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";

const STATUT_BADGE: Record<
  $Enums.type_statut,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  PUBLIE: {
    label: "Publié",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  ARCHIVE: {
    label: "Archivé",
    className: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
  SUPPRIME: {
    label: "Supprimé",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
  },
};

const PageAdminChantiers = () => {
  const router = useRouter();
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const chantiersFiltres = chantiers?.filter((chantier) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      chantier.chantierId.toLowerCase().includes(q) ||
      chantier.chNom.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Panel administrateur
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des chantiers
            </h1>
            {!isLoading && chantiers && (
              <p className="mt-1 text-sm text-gray-500">
                {chantiers.length} chantier{chantiers.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Link
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:bg-dsfr-blue-france-sun-113-hover transition-colors shadow-sm"
            href="/panel-administrateur/chantiers/nouveau?_action=creer-chantier"
          >
            <span className="text-base leading-none">+</span>
            Créer un chantier
          </Link>
        </div>

        <AlerteMetadataChantier />

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
          ) : chantiersFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun chantier"}
              </p>
              {recherche ? (
                <p className="text-sm mt-1">
                  Aucun chantier ne correspond à «&nbsp;{recherche}&nbsp;».
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Créez votre premier chantier pour commencer.
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
                {chantiersFiltres?.map((chantier) => {
                  const badge = STATUT_BADGE[chantier.chState] ?? {
                    label: chantier.chState,
                    className: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <tr
                      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
                      key={chantier.chantierId}
                      onClick={() =>
                        router.push(
                          `/panel-administrateur/chantiers/${chantier.chantierId}`,
                        )
                      }
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {chantier.chantierId}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {chantier.chNom}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(chantier.updatedAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageAdminChantiers;
