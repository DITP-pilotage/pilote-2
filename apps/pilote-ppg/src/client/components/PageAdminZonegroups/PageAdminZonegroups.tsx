import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "@/server/infrastructure/api/trpc/api";

const PageAdminZonegroups = () => {
  const router = useRouter();
  const { data: zonegroups, isLoading } =
    api.metadataZonegroup.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const zonegroupsFiltres = zonegroups?.filter((zonegroup) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      zonegroup.zoneGroupId.toLowerCase().includes(q) ||
      zonegroup.zgName.toLowerCase().includes(q)
    );
  });

  const succès = router.query._action === "creation-reussie";

  return (
    <div className="min-h-screen bg-[#f5f5fe]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Zone groupe créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-[#000091] uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-[#1e1e1e]">Zones groupes</h1>
            {!isLoading && zonegroups && (
              <p className="mt-1 text-sm text-gray-500">
                {zonegroups.length} zone{zonegroups.length !== 1 ? "s" : ""}{" "}
                groupe
              </p>
            )}
          </div>
          <Link
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#000091] text-white rounded-sm text-sm font-medium hover:bg-[#1212ff] transition-colors shadow-sm"
            href="/panel-administrateur/referentiels/zonegroups/nouveau?_action=creer-zonegroup"
          >
            <span className="text-base leading-none">+</span>
            Créer un groupe
          </Link>
        </div>

        <div className="mb-4">
          <div className="relative w-full max-w-md">
            <svg
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-[#000091]"
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher par ID ou nom…"
              type="search"
              value={recherche}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, index) => (
                <div
                  className="flex items-center gap-6 px-6 py-4 animate-pulse"
                  key={index}
                >
                  <div className="h-3 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded flex-1" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : zonegroupsFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🗺</p>
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun groupe de zones"}
              </p>
              {recherche && (
                <p className="text-sm mt-1">
                  Aucun groupe ne correspond à «&nbsp;{recherche}&nbsp;».
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
                    Zones
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
                {zonegroupsFiltres?.map((zonegroup) => {
                  const supprimé = zonegroup.deletedAt !== null;
                  return (
                    <tr
                      className="hover:bg-[#f5f5fe] transition-colors cursor-pointer"
                      key={zonegroup.zoneGroupId}
                      onClick={() =>
                        router.push(
                          `/panel-administrateur/referentiels/zonegroups/${zonegroup.zoneGroupId}`,
                        )
                      }
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {zonegroup.zoneGroupId}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1e1e1e]">
                        <span
                          className={
                            supprimé ? "line-through text-gray-400" : ""
                          }
                        >
                          {zonegroup.zgName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {zonegroup.nbZones} zone
                        {zonegroup.nbZones !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4">
                        {supprimé && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
                            Supprimé
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(zonegroup.updatedAt).toLocaleDateString(
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

export default PageAdminZonegroups;
