import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { PageMonProfilUtilisateur } from "@/components/PageMonProfilUtilisateur/PageMonProfilUtilisateur";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";

export default function NextPageMonProfilUtilisateur() {
  return (
    <>
      <Head>
        <title>Mon profil utilisateur</title>
      </Head>
      <PageMonProfilUtilisateur />
    </>
  );
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
