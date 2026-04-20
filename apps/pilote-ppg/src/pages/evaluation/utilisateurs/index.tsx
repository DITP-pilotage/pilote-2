import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageUtilisateursPiloteEval } from "@/components/PageUtilisateursPiloteEval/PageUtilisateursServerSideContext";
import { TableauUtilisateurs } from "@/components/PageUtilisateursPiloteEval/TableauUtilisateurs";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

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

export default function UtilisateursPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pageUtilisateursPiloteEval.ServerSidePropsProvider value={props}>
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

            <TableauUtilisateurs />
          </div>
        </div>
      </main>
    </pageUtilisateursPiloteEval.ServerSidePropsProvider>
  );
}
