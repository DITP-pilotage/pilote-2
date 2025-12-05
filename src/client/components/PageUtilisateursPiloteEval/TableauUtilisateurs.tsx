import { useRouter } from "next/router";
import { formaterDate } from "@/client/utils/date/date";
import { pageUtilisateursPiloteEval } from "@/components/PageUtilisateursPiloteEval/PageUtilisateursServerSideContext";

export const TableauUtilisateurs = () => {
  const { utilisateurs } =
    pageUtilisateursPiloteEval.useServerSidePropsContext();
  const router = useRouter();

  if (utilisateurs.length === 0) {
    return (
      <p className="text-dsfr-grey-625">
        Aucun utilisateur n'a accès à Pilote Eval pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto bg-white shadow-sm rounded-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-dsfr-blue-france-925 border-b-2 text-left font-bold text-sm">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Nom</th>
            <th className="px-4 py-3">Prénom</th>
            <th className="px-4 py-3">Profil</th>
            <th className="px-4 py-3">Dernière modification</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dsfr-grey-925 text-sm">
          {utilisateurs.map((utilisateur, index) => (
            <tr
              className={`cursor-pointer transition-colors hover:bg-dsfr-alt-blue-france ${
                index % 2 === 0 ? "bg-white" : "bg-dsfr-grey-1000"
              }`}
              key={utilisateur.id}
              onClick={() =>
                router.push(`/evaluation/utilisateur/${utilisateur.id}`)
              }
            >
              <td className="px-4 py-3">{utilisateur.email}</td>
              <td className="px-4 py-3">{utilisateur.nom}</td>
              <td className="px-4 py-3">{utilisateur.prenom}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-dsfr-blue-france-925 text-dsfr-blue-france-sun-113">
                  {utilisateur.profilCode}
                </span>
              </td>
              <td className="px-4 py-3">
                {formaterDate(
                  utilisateur.dateDerniereModification,
                  "DD/MM/YYYY",
                ) ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
