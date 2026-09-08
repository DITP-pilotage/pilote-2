import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { PageConnexion } from "@/client/components/PageConnexion/PageConnexion";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};

const NextPageConnexion: FunctionComponent = () => (
  <>
    <Head>
      <title>Connexion - PILOTE</title>
    </Head>
    <PageConnexion />
  </>
);

export default NextPageConnexion;
