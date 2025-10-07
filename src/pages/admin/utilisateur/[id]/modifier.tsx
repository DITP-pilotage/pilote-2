import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import RécupérerUnUtilisateurUseCase from "@/server/gestion-utilisateur/usecases/RécupérerUnUtilisateurUseCase";
import PageModifierUtilisateur from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateur";
import { commenceParUneVoyelle } from "@/client/utils/strings";
import { dependencies } from "@/server/infrastructure/Dependencies";
import { pageModifierUtilisateur } from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateurServerSideContext";
import { configurationFeatureFlip } from "@/config";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext<{ id: Utilisateur["id"] }>) => {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await getServerAuthSession({ req, res });

  if (!params?.id || !session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerEtModifierUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  const utilisateurDemandé = await new RécupérerUnUtilisateurUseCase(
    dependencies.getUtilisateurRepository(),
  ).run(params.id);
  if (!utilisateurDemandé) {
    return redirigerVersPageAccueil;
  }

  if (
    !habilitations.peutAccéderAuxTerritoires(
      utilisateurDemandé.habilitations.lecture.territoires,
    )
  ) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {
      utilisateur: utilisateurDemandé,
      estAutoriseAVoirLeSelecteurApplication:
        configurationFeatureFlip().piloteEval &&
        [ProfilEnum.DITP_ADMIN].includes(session.profil),
    },
  };
};

const NextPageModifierUtilisateur = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  return (
    <pageModifierUtilisateur.ServerSidePropsProvider value={props}>
      <Head>
        <title>
          Modifier le compte 
          {commenceParUneVoyelle(props.utilisateur.prénom) ? "d'" : "de "}
          {props.utilisateur.prénom} {props.utilisateur.nom.toUpperCase()} - 
          PILOTE
        </title>
      </Head>
      <PageModifierUtilisateur />
    </pageModifierUtilisateur.ServerSidePropsProvider>
  );
};

export default NextPageModifierUtilisateur;
