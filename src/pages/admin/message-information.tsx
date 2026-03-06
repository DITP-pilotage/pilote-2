import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";
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
import { RécupérerMessageInformationUseCase } from "@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase";
import { dependencies } from "@/server/infrastructure/Dependencies";

const NextAdminMessageInformation: FunctionComponent<{
  messageInformation: MessageInformationContrat;
}> = ({ messageInformation }) => {
  return (
    <>
      <Head>
        <title>Message d'information - Pilote</title>
      </Head>
      <PageMessageInformation messageInformation={messageInformation} />
    </>
  );
};
export default NextAdminMessageInformation;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await auth(context);
  if (!session || !estAutoriséAModifierDesIndicateurs(session.profil)) {
    throw new Error("Not connected or not authorized ?");
  }

  const messageInformation = presenterEnMessageInformationContrat(
    await new RécupérerMessageInformationUseCase({
      gestionContenuRepository: dependencies.getGestionContenuRepository(),
    }).run(),
  );

  return {
    props: {
      messageInformation,
    },
  };
}
