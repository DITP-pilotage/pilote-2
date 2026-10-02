import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configuration } from "@/config";
import { PageActualites } from "@/components/PageActualites/PageActualites";

export default function NextPageActualites({
  brevoDesactive,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Actualités - PILOTE</title>
      </Head>
      <PageActualites brevoDesactive={brevoDesactive} />
    </>
  );
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

  if (!session || !session.user) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: { brevoDesactive: configuration().brevo.disableEmails } };
};
