import { useState } from "react";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import Loader from "@/components/_commons/Loader/Loader";
import { Lien } from "@/components/_commons/Lien/Lien";
import { BadgeStatutReferentiel } from "@/components/_commons/BadgeStatutReferentiel";
import { InputRecherche } from "@/components/_commons/InputRecherche/InputRecherche";
import type { PerimetreAdminListItem } from "@/server/metadataPerimetre/queries/ListerPerimetresAdminQuery";

const LignePerimetre = ({
  perimetre,
}: {
  perimetre: PerimetreAdminListItem;
}) => {
  const router = useRouter();
  const supprimé = perimetre.deletedAt !== null;
  return (
    <tr
      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
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
      <td className="px-6 py-4 font-medium text-gray-900">
        <span className={supprimé ? "line-through text-gray-400" : ""}>
          {perimetre.perNom}
        </span>
      </td>
      <td className="px-6 py-4 text-xs text-gray-500">
        {perimetre.porteurShort ?? "-"}
      </td>
      <td className="px-6 py-4">
        <BadgeStatutReferentiel supprimé={supprimé} />
      </td>
      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
        {new Date(perimetre.updatedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
    </tr>
  );
};

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
    <div className="min-h-screen bg-dsfr-alt-blue-france">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {succès && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
            Périmètre créé avec succès.
          </div>
        )}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">
              Référentiels
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Périmètres</h1>
            {!isLoading && perimetres && (
              <p className="mt-1 text-sm text-gray-500">
                {perimetres.length} périmètre
                {perimetres.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Lien
            href="/panel-administrateur/referentiels/perimetres/nouveau?_action=creer-perimetre"
            label="+ Créer un périmètre"
            variant="button"
          />
        </div>

        <div className="mb-4">
          <InputRecherche
            className="w-full max-w-md"
            onChange={setRecherche}
            placeholder="Rechercher par ID ou nom…"
            value={recherche}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="relative py-20">
              <Loader />
            </div>
          ) : perimetresFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
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
                {perimetresFiltres?.map((perimetre) => (
                  <LignePerimetre
                    key={perimetre.perimetreId}
                    perimetre={perimetre}
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

export default PageAdminPerimetres;
