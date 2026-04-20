import Head from "next/head";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { FunctionComponent } from "react";
import { createLoader, parseAsString } from "nuqs/server";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";

const loadSearchParams = createLoader({
  callbackUrl: parseAsString,
});

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, query } = context;
  const session = await auth(context);
  const searchParams = loadSearchParams(query);

  if (session) {
    const territoireCode = session.habilitations.lecture.territoires.includes(
      "NAT-FR",
    )
      ? "NAT-FR"
      : session.habilitations.lecture.territoires[0];

    const callbackUrl = searchParams.callbackUrl
      ? decodeURIComponent(searchParams.callbackUrl)
      : `/accueil/chantier/${territoireCode}`;

    const destination =
      req.url !== "/" && searchParams.callbackUrl
        ? callbackUrl
        : `/accueil/chantier/${territoireCode}`;

    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

const NextPageAccueil: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = () => {
  return (
    <Head>
      <title>PILOTE - Piloter l'action publique par les résultats</title>
    </Head>
  );
};

export default NextPageAccueil;
