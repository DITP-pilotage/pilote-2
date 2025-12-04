import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import { useRouter } from "next/router";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { formaterDate } from "@/client/utils/date/date";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const utilisateurs = await getContainer("piloteEval")
    .resolve("listerUtilisateursPiloteEval")
    .run();

  return {
    props: {
      utilisateurs,
    },
  };
};

const UtilisateursPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { utilisateurs } = props;
  const router = useRouter();

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Gestion des utilisateurs Pilote Eval</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-4">
              Gestion des utilisateurs Pilote Eval
            </h1>
          </header>

          {utilisateurs.length === 0 ? (
            <p className="text-gray-600">
              Aucun utilisateur n'a accès à Pilote Eval pour le moment.
            </p>
          ) : (
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
                      <td className="border border-gray-300 p-3">
                        {utilisateur.nom}
                      </td>
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
          )}
        </div>
      </div>
    </main>
  );
};

export default UtilisateursPage;
