import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const rattachements = await getContainer("piloteEval")
    .resolve("afficherConsolidationQuery")
    .run({ utilisateurId: session.user.id });

  return { props: { rattachements } };
};

export default function PageConsolidation(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { rattachements } = props;

  return (
    <div className="mx-auto w-full max-w-[1200px] py-6">
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
              Rattachement
            </th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
              Libellé
            </th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold w-24">
              Note
            </th>
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold w-32">
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {rattachements.map((rattachement) => (
            <>
              {/* Critères et sous-critères */}
              {rattachement.criteres.map((sousCriteresGroup) => {
                const critere = sousCriteresGroup[0]?.critere;
                if (!critere) return null;

                return (
                  <>
                    {/* Ligne du critère */}
                    <tr key={`critere-${critere.id}`} className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        {rattachement.libelle}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <strong>{critere.libelle}</strong>
                      </td>
                      <td className="border border-gray-300 px-4 py-2" />
                      <td className="border border-gray-300 px-4 py-2" />
                    </tr>
                    {/* Lignes des sous-critères */}
                    {sousCriteresGroup.map((sousCritere) => (
                      <tr key={`sous-critere-${sousCritere.id}`}>
                        <td className="border border-gray-300 px-4 py-2" />
                        <td className="border border-gray-300 px-4 py-2 pl-12">
                          {sousCritere.libelle}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {sousCritere.evaluation.note}
                        </td>
                        <td className="border border-gray-300 px-4 py-2" />
                      </tr>
                    ))}
                  </>
                );
              })}

              {/* Objectifs */}
              {rattachement.objectifs.map((objectif) => (
                <tr key={`objectif-${objectif.id}`}>
                  <td className="border border-gray-300 px-4 py-2">
                    {rattachement.libelle}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {objectif.libelle}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {objectif.evaluation.note}
                  </td>
                  <td className="border border-gray-300 px-4 py-2" />
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
