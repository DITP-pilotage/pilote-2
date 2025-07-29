import { FunctionComponent } from "react";
import Head from "next/head";
import Accessibilite from "@/components/Accessibilite/Accessibilite";

const NextPageAccessibilite: FunctionComponent<{}> = () => {
  return (
    <>
      <Head>
        <title>Accessibilité</title>
      </Head>
      <Accessibilite />
    </>
  );
};

export default NextPageAccessibilite;
