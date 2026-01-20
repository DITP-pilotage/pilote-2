import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { PageMonProfilUtilisateur } from "@/components/PageMonProfilUtilisateur/PageMonProfilUtilisateur";
import { getContainer } from "@/server/dependances";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";

export default function NextPageMonProfilUtilisateur({
  utilisateur,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <PageMonProfilUtilisateur utilisateur={utilisateur} />;
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await getServerAuthSession(context);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const utilisateurRepository = getContainer("gestionUtilisateur").resolve(
    "utilisateurRepository",
  );

  const profilUtilisateur =
    await utilisateurRepository.recupererProfilUtilisateur(session.user.id);

  if (!profilUtilisateur) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      utilisateur: profilUtilisateur,
    },
  };
};
