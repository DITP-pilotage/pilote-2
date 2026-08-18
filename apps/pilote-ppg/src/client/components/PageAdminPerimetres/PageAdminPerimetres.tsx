import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "@/server/infrastructure/api/trpc/api";

const PageAdminPerimetres = () => {
  const router = useRouter();
  const { data: perimetres, isLoading } =
    api.metadataPerimetre.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const perimetresFiltres = perimetres?.filter((perimetre) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      perimetre.perimetreId.toLowerCase().includes(q) ||
      perimetre.perNom.toLowerCase().includes(q)
    );
  });

  const succès = router.query._action === "creation-reussie";

  return (
    <div className="min-h-screen bg-[#f5f5fe]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Périmètre créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-[#000091] uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-[#1e1e1e]">Périmètres</h1>
            {!isLoading && perimetres && (
              <p className="mt-1 text-sm text-gray-500">
                {perimetres.length} périmètre
                {perimetres.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Link
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#000091] text-white rounded-sm text-sm font-medium hover:bg-[#1212ff] transition-colors shadow-sm"
            href="/panel-administrateur/referentiels/perimetres/nouveau?_action=creer-perimetre"
          >
            <span className="text-base leading-none">+</span>
            Créer un périmètre
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
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : perimetresFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📐</p>
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun périmètre"}
              </p>
              {recherche && (
                <p className="text-sm mt-1">
                  Aucun périmètre ne correspond à «&nbsp;{recherche}&nbsp;».
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
                    Porteur
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
                {perimetresFiltres?.map((perimetre) => {
                  const supprimé = perimetre.deletedAt !== null;
                  return (
                    <tr
                      className="hover:bg-[#f5f5fe] transition-colors cursor-pointer"
                      key={perimetre.perimetreId}
                      onClick={() =>
                        router.push(
                          `/panel-administrateur/referentiels/perimetres/${perimetre.perimetreId}`,
                        )
                      }
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {perimetre.perimetreId}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#1e1e1e]">
                        <span
                          className={
                            supprimé ? "line-through text-gray-400" : ""
                          }
                        >
                          {perimetre.perNom}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {perimetre.porteurShort ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {supprimé ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
                            Supprimé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-200">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(perimetre.updatedAt).toLocaleDateString(
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

export default PageAdminPerimetres;
