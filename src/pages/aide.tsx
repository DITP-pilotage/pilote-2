import Head from "next/head";
import { FunctionComponent } from "react";
import CentreDAide from "@/components/CentreDAide/CentreDAide";

const NextPageCentreDAide: FunctionComponent<{}> = () => {
  return (
    <>
      <Head>
        <title>Centre d'aide : Service bientôt disponible ! - PILOTE</title>
      </Head>
      <CentreDAide />
    </>
  );
};

export default NextPageCentreDAide;
