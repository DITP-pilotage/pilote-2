import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import Loader from "@/components/_commons/Loader/Loader";
import { LoupePleineIcon } from "@/components/_commons/Icones/LoupePleineIcon";
import { Lien } from "@/components/_commons/Lien/Lien";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import type { ZonegroupAdminListItem } from "@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery";

const LigneZonegroup = ({
  zonegroup,
}: {
  zonegroup: ZonegroupAdminListItem;
}) => {
  const router = useRouter();
  const supprimé = zonegroup.deletedAt !== null;
  return (
    <tr
      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
      onClick={() =>
        router.push(
          `/panel-administrateur/referentiels/zonegroups/${zonegroup.zoneGroupId}`,
        )
      }
    >
      <td className="px-6 py-4 font-mono text-xs text-gray-400">
        {zonegroup.zoneGroupId}
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">
        <span className={supprimé ? "line-through text-gray-400" : ""}>
          {zonegroup.zgName}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-gray-500">
        {zonegroup.nbZones} zone{zonegroup.nbZones !== 1 ? "s" : ""}
      </td>
      <td className="px-6 py-4">
        <BadgeStatutReferentiel supprimé={supprimé} />
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
        {new Date(zonegroup.updatedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
    </tr>
  );
};

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
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Zone groupe créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Zones groupes</h1>
            {!isLoading && zonegroups && (
              <p className="mt-1 text-sm text-gray-500">
                {zonegroups.length} zone{zonegroups.length !== 1 ? "s" : ""}{" "}
                groupe
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels/zonegroups/nouveau?_action=creer-zonegroup"
            label="+ Créer un groupe"
            variant="button"
          />
        </div>

        <div className="mb-4">
          <div className="relative w-full max-w-md">
            <LoupePleineIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none size-4" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher par ID ou nom…"
              type="search"
              value={recherche}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="relative py-20">
              <Loader />
            </div>
          ) : zonegroupsFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
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
                {zonegroupsFiltres?.map((zonegroup) => (
                  <LigneZonegroup
                    key={zonegroup.zoneGroupId}
                    zonegroup={zonegroup}
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

export default PageAdminZonegroups;
