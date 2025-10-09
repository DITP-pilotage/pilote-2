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
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Rattachement</th>
            <th>Libellé</th>
            <th>Note</th>
            <th>Statut</th>
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
                    <tr key={`critere-${critere.id}`}>
                      <td>{rattachement.libelle}</td>
                      <td>
                        <strong>{critere.libelle}</strong>
                      </td>
                      <td />
                      <td />
                    </tr>
                    {/* Lignes des sous-critères */}
                    {sousCriteresGroup.map((sousCritere) => (
                      <tr key={`sous-critere-${sousCritere.id}`}>
                        <td />
                        <td style={{ paddingLeft: "2rem" }}>
                          {sousCritere.libelle}
                        </td>
                        <td>{sousCritere.evaluation.note}</td>
                        <td />
                      </tr>
                    ))}
                  </>
                );
              })}

              {/* Objectifs */}
              {rattachement.objectifs.map((objectif) => (
                <tr key={`objectif-${objectif.id}`}>
                  <td>{rattachement.libelle}</td>
                  <td>{objectif.libelle}</td>
                  <td>{objectif.evaluation.note}</td>
                  <td />
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
