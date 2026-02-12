import { Suspense } from "react";
import { parseAsString, useQueryState } from "nuqs";
import "@gouvfr/dsfr/dist/component/table/table.min.css";
import api from "@/server/infrastructure/api/trpc/api";

function RapportDetail({ rapportId }: { rapportId: string }) {
  const [rapportDetail] = api.rapportHebdomadaire.récupérer.useSuspenseQuery({
    rapportId,
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const comptesCrees =
    rapportDetail.contenuRapport.sectionActiviteComptes.comptesCrees;
  const comptesDesactives =
    rapportDetail.contenuRapport.sectionActiviteComptes.comptesDesactives;
  const chantiers = rapportDetail.contenuRapport.sectionActiviteChantiers;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Détail du rapport</h2>
      <p className="text-gray-600 mb-6">
        {formatDate(rapportDetail.periodeDebut)} —{" "}
        {formatDate(rapportDetail.periodeFin)}
      </p>

      {/* Section 1: Comptes créés */}
      <h3 className="text-xl font-semibold mb-3">Comptes créés</h3>
      {comptesCrees.length === 0 ? (
        <p className="text-gray-500 mb-6">
          Aucun compte créé sur cette période.
        </p>
      ) : (
        <div className="fr-table mb-6">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Profil</th>
              </tr>
            </thead>
            <tbody>
              {comptesCrees.map((compte) => (
                <tr key={compte.email}>
                  <td>{compte.nom}</td>
                  <td>{compte.prenom}</td>
                  <td>{compte.email}</td>
                  <td>{compte.profil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 2: Comptes désactivés */}
      <h3 className="text-xl font-semibold mb-3">Comptes désactivés</h3>
      {comptesDesactives.length === 0 ? (
        <p className="text-gray-500 mb-6">
          Aucun compte désactivé sur cette période.
        </p>
      ) : (
        <div className="fr-table mb-6">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Profil</th>
              </tr>
            </thead>
            <tbody>
              {comptesDesactives.map((compte) => (
                <tr key={compte.email}>
                  <td>{compte.nom}</td>
                  <td>{compte.prenom}</td>
                  <td>{compte.email}</td>
                  <td>{compte.profil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 3: Activité des chantiers */}
      <h3 className="text-xl font-semibold mb-3">Activité des chantiers</h3>
      {chantiers.length === 0 ? (
        <p className="text-gray-500">
          Aucune activité sur les chantiers pour cette période.
        </p>
      ) : (
        <div className="fr-table">
          <table>
            <thead>
              <tr>
                <th>Chantier</th>
                <th>Nombre d'indicateurs modifiés</th>
                <th>Nombre de territoires impactés</th>
              </tr>
            </thead>
            <tbody>
              {chantiers.map((chantier) => {
                const nombreIndicateurs = chantier.indicateurs.length;
                const nombreTerritoires = chantier.indicateurs.flatMap(
                  (indicateur) => indicateur.territoires,
                ).length;

                return (
                  <tr key={chantier.id}>
                    <td>{chantier.nom}</td>
                    <td>{nombreIndicateurs}</td>
                    <td>{nombreTerritoires}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PageRapportsHebdomadaires() {
  const [rapportId, setRapportId] = useQueryState("rapportId", parseAsString);
  const [rapports] = api.rapportHebdomadaire.lister.useSuspenseQuery();

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
