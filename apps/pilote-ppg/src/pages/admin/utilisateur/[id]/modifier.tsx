import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import { Utilisateur } from "@/shared/utilisateur/Utilisateur.interface";
import PageModifierUtilisateur from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateur";
import { commenceParUneVoyelle } from "@/client/utils/strings";
import { getContainer } from "@/server/dependances";
import { pageModifierUtilisateur } from "@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateurServerSideContext";

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

  const utilisateurDemandé = await getContainer("gestionUtilisateur")
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
