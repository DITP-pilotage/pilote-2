import { type GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ProfilEnum } from "@/server/domain/utilisateur/Utilisateur.interface";
import PageRapportsHebdomadaires from "@/client/components/PageRapportsHebdomadaires/PageRapportsHebdomadaires";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (
    !session ||
    (session.profil !== ProfilEnum.COORDINATEUR_REGION &&
      session.profil !== ProfilEnum.COORDINATEUR_DEPARTEMENT)
  ) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default function RapportsHebdomadairesPage() {
  return <PageRapportsHebdomadaires />;
}
