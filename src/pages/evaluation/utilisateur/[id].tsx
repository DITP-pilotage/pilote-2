import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageUtilisateurPiloteEval } from "@/components/PageUtilisateurPiloteEval/PageUtilisateurPiloteEvalServerSideContext";
import { FormulaireConfigurationDroits } from "@/components/PageUtilisateurPiloteEval/FormulaireConfigurationDroits";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { params } = context;
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

  const utilisateurId = params?.id as string;

  const container = getContainer("piloteEval");

  const [criteres, rattachements, objectifsParRattachement, utilisateur] =
    await Promise.all([
      container.resolve("listerCriteresPiloteEval").run(),
      container.resolve("listerRattachementsPiloteEval").run(),
      container.resolve("listerObjectifsParRattachementPiloteEval").run({
        jalon: 2025,
      }),
      container.resolve("recupererDroitsUtilisateurQuery").run({
        utilisateurId,
        jalon: 2025,
      }),
    ]);

  return {
    props: {
      utilisateurId,
      criteres,
      rattachements,
      objectifsParRattachement,
      utilisateur,
    },
  };
};

export default function UtilisateurDetailPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pageUtilisateurPiloteEval.ServerSidePropsProvider value={props}>
      <main className="py-6 pt-0">
        <Head>
          <title>PILOTE - Configuration des droits utilisateur</title>
        </Head>

        <div className="min-h-[60vh] py-12">
          <div className="mx-auto w-full max-w-6xl">
            <FormulaireConfigurationDroits />
          </div>
        </div>
      </main>
    </pageUtilisateurPiloteEval.ServerSidePropsProvider>
  );
}
