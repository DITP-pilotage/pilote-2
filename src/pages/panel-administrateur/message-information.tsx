import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { FunctionComponent } from "react";
import PageMessageInformation from "@/components/PageAdminGestionContenus/PageMessageInformation";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { estAutoriséAModifierDesIndicateurs } from "@/client/utils/indicateur/indicateur";
import {
  MessageInformationContrat,
  presenterEnMessageInformationContrat,
} from "@/server/app/contrats/MessageInformationContrat";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";

const NextAdminMessageInformation: FunctionComponent<{
  messageInformation: MessageInformationContrat;
  modificationReussie: boolean;
}> = ({ messageInformation, modificationReussie }) => {
  return (
    <>
      <Head>
        <title>
          Panel Administrateur - Message d&apos;information - PILOTE
        </title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="message-information">
        <PageMessageInformation
          messageInformation={messageInformation}
          modificationReussie={modificationReussie}
        />
      </NextPanelAdministrateurLayout>
    </>
  );
};
export default NextAdminMessageInformation;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query } = context;
  const session = await auth(context);
  if (!session || !estAutoriséAModifierDesIndicateurs(session.profil)) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const messageInformation = presenterEnMessageInformationContrat(
    await getContainer("legacy")
      .resolve("récupérerMessageInformationUseCase")
      .run(),
  );

  const modificationReussie = query._action === "modification-reussie";

  return {
    props: {
      messageInformation,
      modificationReussie,
    },
  };
}
