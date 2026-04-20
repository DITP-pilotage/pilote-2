import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import Nouveautés from "@/components/Nouveautés/Nouveautés";
import { getContainer } from "@/server/dependances";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const listeNouveautes = await getContainer("parametrageNouveautes")
    .resolve("listerNouveautesUseCase")
    .execute();

  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  res.setHeader(
    "Set-Cookie",
    `derniereVersionNouveauteConsulte=${listeNouveautes?.[0]?.version || "1.0.0"}; path=/; samesite=lax; expires="${date.toUTCString()}";`,
  );

  return {
    props: {},
  };
};

const NextPageNouveautés: FunctionComponent = () => {
  return (
    <>
      <Head>
        <title>Nouveautés</title>
      </Head>
      <Nouveautés />
    </>
  );
};

export default NextPageNouveautés;
