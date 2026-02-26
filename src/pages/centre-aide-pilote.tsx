import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { PageCentreAidePilote } from "@/components/PageCentreAidePilote/PageCentreAidePilote";

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
