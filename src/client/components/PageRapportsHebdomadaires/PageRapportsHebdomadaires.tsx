import { Suspense } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { api } from "@/client/utils/api";

function RapportDetail({ rapportId }: { rapportId: string }) {
  const { data: rapportDetail } =
    api.rapportHebdomadaire.récupérer.useSuspenseQuery({
      rapportId,
    });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Détail du rapport</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(rapportDetail, null, 2)}
      </pre>
    </div>
  );
}

export default function PageRapportsHebdomadaires() {
  const [rapportId, setRapportId] = useQueryState("rapportId", parseAsString);
  const { data: rapports } = api.rapportHebdomadaire.lister.useSuspenseQuery();

  const getStatutBadgeClass = (statut: string) => {
    switch (statut) {
      case "ENVOYE":
        return "bg-green-100 text-green-800";
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-800";
      case "ERREUR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Rapports hebdomadaires</h1>

        <div className="grid grid-cols-[20rem_1fr] gap-6">
          {/* Liste des rapports */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Mes rapports</h2>
            </div>
            <div className="divide-y">
              {rapports.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm">
                  Aucun rapport disponible
                </div>
              ) : (
                rapports.map((rapport) => (
                  <button
                    key={rapport.id}
                    onClick={() => setRapportId(rapport.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      rapportId === rapport.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium">
                        {formatDate(rapport.periodeDebut)} -{" "}
                        {formatDate(rapport.periodeFin)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatutBadgeClass(
                            rapport.statutEnvoi,
                          )}`}
                        >
                          {rapport.statutEnvoi}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(rapport.dateCreation)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Détail du rapport */}
          <div className="bg-white rounded-lg shadow">
            {rapportId ? (
              <Suspense
                fallback={
                  <div className="p-6 flex items-center justify-center">
                    <div className="text-gray-500">Chargement...</div>
                  </div>
                }
              >
                <RapportDetail rapportId={rapportId} />
              </Suspense>
            ) : (
              <div className="p-6 flex items-center justify-center text-gray-500">
                Sélectionnez un rapport pour voir les détails
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
