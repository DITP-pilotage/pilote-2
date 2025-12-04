import { useRouter } from "next/router";
import { formaterDate } from "@/client/utils/date/date";
import { pageUtilisateursPiloteEval } from "@/components/PageUtilisateursPiloteEval/PageUtilisateursServerSideContext";

export const TableauUtilisateurs = () => {
  const { utilisateurs } =
    pageUtilisateursPiloteEval.useServerSidePropsContext();
  const router = useRouter();

  if (utilisateurs.length === 0) {
    return (
      <p className="text-gray-600">
        Aucun utilisateur n'a accès à Pilote Eval pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Email
            </th>
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Nom
            </th>
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Prénom
            </th>
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Profil
            </th>
            <th className="border border-gray-300 p-3 text-left font-semibold">
              Dernière modification
            </th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((utilisateur) => (
            <tr
              className="cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-200"
              key={utilisateur.id}
              onClick={() =>
                router.push(`/evaluation/utilisateur/${utilisateur.id}`)
              }
            >
              <td className="border border-gray-300 p-3">
                {utilisateur.email}
              </td>
              <td className="border border-gray-300 p-3">{utilisateur.nom}</td>
              <td className="border border-gray-300 p-3">
                {utilisateur.prenom}
              </td>
              <td className="border border-gray-300 p-3">
                {utilisateur.profilCode}
              </td>
              <td className="border border-gray-300 p-3">
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
