import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { PagePanelAdministrateurLogs } from "@/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/PagePanelAdministrateurLogs";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  return { props: {} };
};

const NextPagePanelAdministrateurLogs = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Logs applicatifs - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="logs">
        <PagePanelAdministrateurLogs />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurLogs;
