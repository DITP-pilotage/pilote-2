import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";
import { PageActualites } from "@/components/PageActualites/PageActualites";

export default function NextPageActualites() {
  return (
    <>
      <Head>
        <title>Actualités - PILOTE</title>
      </Head>
      <PageActualites />
    </>
  );
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const variables = await getContainer("legacy")
    .resolve("recupererToutesLesVariablesContenuUseCase")
    .run();

  if (!variables.NEXT_PUBLIC_FF_PAGE_ACTUALITES) {
    return { redirect: { destination: "/404" } };
  }

  const session = await auth(context);

  if (!session || !session.user) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};
