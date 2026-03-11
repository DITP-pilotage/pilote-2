import { GetServerSidePropsContext } from "next/types";
import Head from "next/head";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import PageUtilisateur from "@/components/PageUtilisateur/PageUtilisateur";
import {
  presenterEnTokenAPIInformationContrat,
  TokenAPIInformationContrat,
} from "@/server/authentification/app/contrats/TokenAPIInformationContrat";
import { commenceParUneVoyelle } from "@/client/utils/strings";
import { getContainer } from "@/server/dependances";

export interface NextPageAdminUtilisateurProps {
  utilisateur: Utilisateur;
  tokenAPIInformation: TokenAPIInformationContrat;
}

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: Utilisateur["id"] }>,
) {
  const { params } = context;
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await auth(context);

  if (!params?.id || !session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }
  const utilisateurDemandé = await getContainer("legacy")
    .resolve("récupérerUnUtilisateurUseCase")
    .run(params.id);

  if (!utilisateurDemandé) {
    return redirigerVersPageAccueil;
  }

  const tokenAPIInformation = await getContainer("legacy")
    .resolve("recupererTokenAPIInformationUseCase")
    .run({ email: utilisateurDemandé.email })
    .then((tokenAPI) => {
      return tokenAPI ? presenterEnTokenAPIInformationContrat(tokenAPI) : null;
    });

  return {
    props: {
      utilisateur: utilisateurDemandé,
      tokenAPIInformation,
    },
  };
}

const NextPageAdminUtilisateur: FunctionComponent<
  NextPageAdminUtilisateurProps
> = ({ utilisateur, tokenAPIInformation }) => {
  return (
    <>
      <Head>
        <title>
          Compte {commenceParUneVoyelle(utilisateur.prénom) ? "d'" : "de "}
          {utilisateur.prénom} {utilisateur.nom.toUpperCase()} - PILOTE
        </title>
      </Head>
      <PageUtilisateur
        tokenAPIInformation={tokenAPIInformation}
        utilisateur={utilisateur}
      />
    </>
  );
};

export default NextPageAdminUtilisateur;
