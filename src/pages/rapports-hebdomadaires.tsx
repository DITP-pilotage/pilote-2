import { type GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import PageRapportsHebdomadaires from "@/client/components/PageRapportsHebdomadaires/PageRapportsHebdomadaires";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

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
