import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import PageModifierUtilisateur from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateur";
import { commenceParUneVoyelle } from "@/client/utils/strings";
import { getContainer } from "@/server/dependances";
import { pageModifierUtilisateur } from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateurServerSideContext";
import { configurationFeatureFlip } from "@/config";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ id: Utilisateur["id"] }>,
) => {
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

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerEtModifierUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  const utilisateurDemandé = await getContainer("legacy")
    .resolve("récupérerUnUtilisateurUseCase")
    .run(params.id);
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
      creationCompteArsActive: configurationFeatureFlip().creationCompteArs,
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
