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

  const moyenneNote =
    chantiersEvaluation.length > 0
      ? chantiersEvaluation.reduce(
          (acc, chantier) => ({
            total: acc.total + (chantier.taux_avancement ?? 0),
            count: acc.count + (chantier.taux_avancement !== null ? 1 : 0),
          }),
          { total: 0, count: 0 },
        )
      : null;

  const moyenneNotePilote =
    chantiersEvaluation.length > 0
      ? chantiersEvaluation.reduce(
          (acc, chantier) => ({
            total: acc.total + (chantier.taux_avancement_pilote ?? 0),
            count:
              acc.count + (chantier.taux_avancement_pilote !== null ? 1 : 0),
          }),
          { total: 0, count: 0 },
        )
      : null;

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Détails note collective</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-2">
              Bienvenue sur le détail de votre note collective
            </h1>
          </header>

          {moyenneNote !== null &&
            moyenneNotePilote !== null &&
            moyenneNote.count > 0 &&
            moyenneNotePilote.count > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-medium !font-bold uppercase tracking-wide mb-2">
                      note
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-purple-700">
                        {Math.round(moyenneNote.total / moyenneNote.count)}
                      </span>
                      <span className="text-lg font-medium text-gray-400">
                        / 100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-medium !font-bold uppercase tracking-wide mb-2">
                      note Pilote
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-blue-700">
                        {Math.round(
                          moyenneNotePilote.total / moyenneNotePilote.count,
                        )}
                      </span>
                      <span className="text-lg font-medium text-gray-400">
                        / 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="bg-white rounded shadow">
            <header className="p-6">
              <span className="font-bold">
                Détail des chantiers et objectifs collectifs de votre territoire
              </span>
            </header>

            <div className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Chantier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Note
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Note Pilote
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {chantiersEvaluation.length === 0 ? (
                      <tr>
                        <td
                          className="px-6 py-4 text-center text-gray-500"
                          colSpan={3}
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
                              <span className="text-sm text-gray-500">ND</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {chantier.taux_avancement_pilote !== null ? (
                              <span className="text-xs px-2 py-1.5 rounded-md whitespace-nowrap bg-blue-100 text-blue-700">
                                {Math.round(chantier.taux_avancement_pilote)} /
                                100
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">ND</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PageDetailsNoteCollective;
