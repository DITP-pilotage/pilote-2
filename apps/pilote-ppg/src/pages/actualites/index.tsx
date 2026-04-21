import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
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
  const session = await auth(context);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
