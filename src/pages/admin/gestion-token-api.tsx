import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";
import Head from "next/head";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import PageAdminGestionTokenAPI from "@/components/PageAdminGestionTokenAPI/PageAdminGestionTokenAPI";
import { TokenAPIInformationContrat } from "@/server/authentification/app/contrats/TokenAPIInformationContrat";
import { ListerTokenAPIInformationUseCase } from "@/server/authentification/usecases/ListerTokenAPIInformationUseCase";
import { getContainer } from "@/server/dependances";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const PROFIL_AUTORISE_A_MODIFIER = new Set([ProfilEnum.DITP_ADMIN]);

export function estAutoriséAModifierLesTokensAPI(profil: string): boolean {
  return PROFIL_AUTORISE_A_MODIFIER.has(profil);
}

export const getServerSideProps: GetServerSideProps<{
  listeTokenAPIInformation: TokenAPIInformationContrat[];
  suppressionReussie: boolean;
}> = async (context) => {
  const { query } = context;
  const session = await auth(context);
  if (
    process.env.NEXT_PUBLIC_FF_GESTION_TOKEN_API !== "true" ||
    !session ||
    !estAutoriséAModifierLesTokensAPI(session.profil)
  ) {
    throw new Error("Not connected or not authorized ?");
  }

  const listeTokenAPIInformation = await new ListerTokenAPIInformationUseCase({
    tokenAPIInformationRepository: getContainer("legacy").resolve(
      "tokenAPIInformationRepository",
    ),
  }).run();

  const suppressionReussie = query._action === "suppression-reussie";

  return {
    props: {
      listeTokenAPIInformation,
      suppressionReussie,
    },
  };
};

const NextAdminTokenApi: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ listeTokenAPIInformation, suppressionReussie }) => {
  return (
    <>
      <Head>
        <title>Gestion des tokens API - Pilote</title>
      </Head>
      <div>
        <PageAdminGestionTokenAPI
          listeTokenAPIInformation={listeTokenAPIInformation}
          suppressionReussie={suppressionReussie}
        />
      </div>
    </>
  );
};

export default NextAdminTokenApi;
