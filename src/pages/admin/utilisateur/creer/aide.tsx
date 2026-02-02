import { GetServerSidePropsContext } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { PageCréerUtilisateurAide } from "@/components/PageCreerUtilisateurAide/PageCréerUtilisateurAide";

const NextPageCréerUtilisateurAide: FunctionComponent = () => {
  return <PageCréerUtilisateurAide />;
};
export default NextPageCréerUtilisateurAide;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await auth(context);

  if (!session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerEtModifierUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
}
