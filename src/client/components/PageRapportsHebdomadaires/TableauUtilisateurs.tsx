import "@gouvfr/dsfr/dist/component/table/table.min.css";
import api from "@/server/infrastructure/api/trpc/api";
import { type CompteActivite } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

export const TableauUtilisateurs = ({
  comptes,
}: {
  comptes: CompteActivite[];
}) => {
  const [profils] = api.profil.récupérerTous.useSuspenseQuery();

  const profilParCode = new Map(
    profils.map((p: { code: string; nom: string }) => [p.code, p.nom]),
  );

  return (
    <div className="fr-table fr-mb-0 fr-pt-0">
      <table className="table">
        <thead className="bg-dsfr-blue-france-925">
          <tr>
            <th>Prénom</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Profil</th>
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {comptes.map((compte) => (
            <tr key={compte.email}>
              <td>{compte.prenom}</td>
              <td>{compte.nom}</td>
              <td>{compte.email}</td>
              <td>{profilParCode.get(compte.profil) ?? compte.profil}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
