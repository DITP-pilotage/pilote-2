import { type GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import PageRapportsHebdomadaires from "@/client/components/PageRapportsHebdomadaires/PageRapportsHebdomadaires";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });

  if (!habilitation.estAutoriseAAccederAuxRapportsHebdomadaires()) {
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
