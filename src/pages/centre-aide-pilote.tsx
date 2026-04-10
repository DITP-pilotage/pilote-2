import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { PageCentreAidePilote } from "@/components/PageCentreAidePilote/PageCentreAidePilote";
import { useEnv } from "@/client/hooks/useEnv";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

const NextPageCentreAidePilote: FunctionComponent = () => {
  const ffCentreAidePilote = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE");

  if (!ffCentreAidePilote) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Centre d&apos;aide - PILOTE</title>
      </Head>
      <PageCentreAidePilote />
    </>
  );
};

export default NextPageCentreAidePilote;
