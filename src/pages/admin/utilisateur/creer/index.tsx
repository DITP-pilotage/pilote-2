import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import PageCréerUtilisateur from "@/components/PageUtilisateurFormulaire/PageCréerUtilisateur/PageCréerUtilisateur";
import { pageCreerUtilisateur } from "@/components/PageUtilisateurFormulaire/PageCréerUtilisateur/PageCreerUtilisateurServerSideContext";
import { configurationFeatureFlip } from "@/config";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export async function getServerSideProps({
  req,
  res,
}: GetServerSidePropsContext) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await getServerAuthSession({ req, res });

  if (!session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerEtModifierUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {
      estAutoriseAVoirLeSelecteurApplication:
        configurationFeatureFlip().piloteEval &&
        [ProfilEnum.DITP_ADMIN].includes(session.profil),
    },
  };
}

const NextPageCréerUtilisateur = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  return (
    <pageCreerUtilisateur.ServerSidePropsProvider value={props}>
      <Head>
        <title>Créer un compte - PILOTE</title>
      </Head>
      <PageCréerUtilisateur />
    </pageCreerUtilisateur.ServerSidePropsProvider>
  );
};

export default NextPageCréerUtilisateur;
