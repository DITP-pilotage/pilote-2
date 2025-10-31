import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  const rattachementCode = z.string().parse(params?.rattachementCode);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const chantiersEvaluation = await getContainer("piloteEval")
    .resolve("recupererDetailsNoteCollectiveQuery")
    .run({ rattachementCode, jalon: 2025 });

  return {
    props: {
      chantiersEvaluation,
    },
  };
};

const PageDetailsNoteCollective = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { chantiersEvaluation } = props;

  return (
    <>
      <Head>
        <title>PILOTE - Détails note collective</title>
      </Head>

      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Détails note collective</h1>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Chantier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chantiersEvaluation.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-4 text-center text-gray-500"
                    colSpan={2}
                  >
                    Aucun chantier trouvé
                  </td>
                </tr>
              ) : (
                chantiersEvaluation.map((chantier) => (
                  <tr className="hover:bg-gray-50" key={chantier.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <IconeMinistere
                          className="text-dsfr-blue-france-sun-113"
                          icone={chantier.icone_ministere}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {chantier.nom}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {chantier.taux_avancement !== null ? (
                        <span className="text-xs px-2 py-1.5 rounded-md whitespace-nowrap bg-purple-100 text-purple-700">
                          {Math.round(chantier.taux_avancement)} / 100
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Non renseigné
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PageDetailsNoteCollective;
