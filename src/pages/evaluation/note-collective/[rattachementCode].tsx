import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import { useState } from "react";
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
  const [expandedChantiers, setExpandedChantiers] = useState<Set<string>>(
    new Set(),
  );

  const toggleChantier = (chantierId: string) => {
    setExpandedChantiers((prev) => {
      const next = new Set(prev);
      if (next.has(chantierId)) {
        next.delete(chantierId);
      } else {
        next.add(chantierId);
      }
      return next;
    });
  };

  const moyenneNote =
    chantiersEvaluation.length > 0
      ? chantiersEvaluation.reduce(
          (acc, chantier) => ({
            total: acc.total + (chantier.tauxAvancement ?? 0),
            count: acc.count + (chantier.tauxAvancement !== null ? 1 : 0),
          }),
          { total: 0, count: 0 },
        )
      : null;

  const moyenneNotePilote =
    chantiersEvaluation.length > 0
      ? chantiersEvaluation.reduce(
          (acc, chantier) => ({
            total: acc.total + (chantier.tauxAvancementPilote ?? 0),
            count: acc.count + (chantier.tauxAvancementPilote !== null ? 1 : 0),
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
                      chantiersEvaluation.map((chantier) => {
                        const isExpanded = expandedChantiers.has(chantier.id);
                        const hasIndicateurs = chantier.indicateurs.length > 0;

                        return (
                          <>
                            <tr className="hover:bg-gray-50" key={chantier.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <button
                                    aria-expanded={isExpanded}
                                    aria-label={
                                      isExpanded
                                        ? "Masquer les indicateurs"
                                        : "Afficher les indicateurs"
                                    }
                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => toggleChantier(chantier.id)}
                                    type="button"
                                  >
                                    <svg
                                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        clipRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        fillRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                  <IconeMinistere
                                    className="text-dsfr-blue-france-sun-113"
                                    icone={chantier.iconeMinistere}
                                  />
                                  <span className="text-sm font-medium text-gray-900">
                                    {chantier.nom}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {chantier.tauxAvancement !== null ? (
                                  <span className="text-xs px-2 py-1.5 rounded-md whitespace-nowrap bg-purple-100 text-purple-700">
                                    {Math.round(chantier.tauxAvancement)} / 100
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-500">
                                    ND
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {chantier.tauxAvancementPilote !== null ? (
                                  <span className="text-xs px-2 py-1.5 rounded-md whitespace-nowrap bg-blue-100 text-blue-700">
                                    {Math.round(chantier.tauxAvancementPilote)}{" "}
                                    / 100
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-500">
                                    ND
                                  </span>
                                )}
                              </td>
                            </tr>

                            {isExpanded ? (
                              hasIndicateurs ? (
                                chantier.indicateurs.map((indicateur) => (
                                  <tr
                                    className="bg-gray-50"
                                    key={indicateur.id}
                                  >
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-3 pl-8">
                                        <svg
                                          className="w-4 h-4 text-gray-400"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <span className="text-sm text-gray-700">
                                          {indicateur.nom}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      {indicateur.tauxAvancement !== null ? (
                                        <span className="text-xs px-2 py-1 rounded-md whitespace-nowrap bg-purple-50 text-purple-600">
                                          {Math.round(
                                            indicateur.tauxAvancement,
                                          )}{" "}
                                          / 100
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-400">
                                          ND
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      {indicateur.tauxAvancementPilote !==
                                      null ? (
                                        <span className="text-xs px-2 py-1 rounded-md whitespace-nowrap bg-blue-50 text-blue-600">
                                          {Math.round(
                                            indicateur.tauxAvancementPilote,
                                          )}{" "}
                                          / 100
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-400">
                                          ND
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr className="bg-gray-50">
                                  <td
                                    className="px-6 py-3 text-center text-gray-500 italic"
                                    colSpan={3}
                                  >
                                    Aucun indicateur pour ce chantier
                                  </td>
                                </tr>
                              )
                            ) : null}
                          </>
                        );
                      })
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
