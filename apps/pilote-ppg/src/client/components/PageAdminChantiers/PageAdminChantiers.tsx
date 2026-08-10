import Link from "next/link";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import Alerte from "@/components/_commons/Alerte/Alerte";

const PageAdminChantiers = () => {
  const router = useRouter();
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();

  const modificationReussie = router.query._action === "modification-reussie";
  const creationReussie = router.query._action === "creation-reussie";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des chantiers</h1>
        <Link
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          href="/panel-administrateur/chantiers/nouveau?_action=creer-chantier"
        >
          Créer un chantier
        </Link>
      </div>

      {modificationReussie && (
        <div className="mb-4">
          <Alerte titre="Chantier modifié avec succès !" type="succès" />
        </div>
      )}

      {creationReussie && (
        <div className="mb-4">
          <Alerte titre="Chantier créé avec succès !" type="succès" />
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                <th className="py-3 pr-4 font-medium">ID</th>
                <th className="py-3 pr-4 font-medium">Nom</th>
                <th className="py-3 pr-4 font-medium">PPG</th>
                <th className="py-3 pr-4 font-medium">Statut</th>
                <th className="py-3 pr-4 font-medium">Territorialisé</th>
                <th className="py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chantiers?.map((chantier) => (
                <tr
                  className="border-b border-gray-100 hover:bg-gray-50"
                  key={chantier.chantierId}
                >
                  <td className="py-3 pr-4 font-mono text-xs">
                    {chantier.chantierId}
                  </td>
                  <td
                    className="py-3 pr-4 max-w-xs truncate"
                    title={chantier.chNom}
                  >
                    {chantier.chNom}
                  </td>
                  <td className="py-3 pr-4 text-xs">{chantier.chPpg}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100">
                      {chantier.chState}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center">
                    {chantier.chTerrito ? "✓" : "—"}
                  </td>
                  <td className="py-3">
                    <Link
                      className="text-blue-600 hover:underline text-xs"
                      href={`/panel-administrateur/chantiers/${chantier.chantierId}`}
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {chantiers?.length === 0 && (
            <p className="text-center text-gray-400 py-8">Aucun chantier.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PageAdminChantiers;
