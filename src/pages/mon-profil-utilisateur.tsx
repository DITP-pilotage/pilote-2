import { GetServerSidePropsContext } from "next";
import { PageMonProfilUtilisateur } from "@/components/PageMonProfilUtilisateur/PageMonProfilUtilisateur";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";

export default function NextPageMonProfilUtilisateur() {
  return <PageMonProfilUtilisateur />;
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

  return {
    props: {},
  };
};
