import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ApplicationAccessible } from "@/server/domain/utilisateur/Utilisateur.interface";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(ApplicationAccessible.PILOTE_EVAL)
  ) {
    return {
      redirect: {
        destination: "404",
      },
    };
  }

  const fichesEvaluation = await getContainer("piloteEval")
    .resolve("listerFichesAutoEvaluation")
    .run({ utilisateurId: session.user.id });

  return { props: { fichesEvaluation } };
};

const EvaluationPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { fichesEvaluation } = props;

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh]">
        <div className="bg-white mx-auto w-full max-w-4xl py-6">
          <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
            <span className="font-bold text-sm">Mes auto-évaluations</span>
          </header>
          <div className="p-4">
            <ul className="space-y-2 !list-none !px-0">
              {fichesEvaluation.map((ficheEvaluation) => (
                <li key={ficheEvaluation.id}>
                  <a
                    className="block p-4 border border-gray-300 rounded hover:bg-gray-50 flex justify-between items-center"
                    href={`/evaluation/auto-evaluation/${ficheEvaluation.id}`}
                  >
                    {ficheEvaluation.rattachement.libelle}

                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1.5 rounded-md">
                      {ficheEvaluation.etapeCourante}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EvaluationPage;
