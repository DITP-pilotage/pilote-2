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

  const rattachements = await getContainer("piloteEval")
    .resolve("listerRattachements")
    .run();

  return { props: { rattachements } };
};

const EvaluationPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { rattachements } = props;

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh]">
        <div className="bg-white mx-auto w-full max-w-4xl">
          <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
            <span className="font-bold text-sm">Mes auto-évaluations</span>
          </header>
          <div className="p-4">
            <ul className="space-y-2 !list-none !px-0">
              {rattachements.map((rattachement) => (
                <li key={rattachement.id}>
                  <a
                    className="block p-4 border border-gray-300 rounded hover:bg-gray-50"
                    href={`/evaluation/auto-evaluation/${rattachement.id}`}
                  >
                    {rattachement.nom}
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
