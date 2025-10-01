import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import NextPanelAdministrateurLayout from "./layout";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerAuthSession({ req, res });
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  if (!session) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
};

const NextPagePanelAdministrateurParametrageSourceIndicateur = () => {
  return (
    <>
      <Head>
        <title>
          Panel administrateur - Paramétrage source indicateur - PILOTE
        </title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="parametrage-source-indicateur">
        <h2>Paramétrage source indicateur</h2>
        <p>
          Officia cupidatat consequat reprehenderit Lorem sint cillum mollit.
          Mollit et occaecat ex magna est amet minim. Officia irure Lorem amet
          mollit et aliqua dolore proident incididunt ad. Consectetur incididunt
          anim pariatur officia mollit. Consequat dolor ullamco enim. Ut non
          magna minim enim anim. Nisi aliquip elit quis laboris quis incididunt
          consequat velit do esse quis. Culpa aliqua elit veniam tempor non
          dolore veniam pariatur nostrud qui. Occaecat do eiusmod labore
          exercitation pariatur cupidatat. Consequat proident velit laborum
          dolor enim laboris enim laboris anim aliquip quis irure magna. Commodo
          minim anim incididunt mollit dolore mollit consequat magna dolor.
          Deserunt id ea est et laborum exercitation ea mollit fugiat voluptate
          officia culpa. Veniam in dolor excepteur eu consequat laboris sint
          sunt cupidatat dolore. Occaecat cupidatat aliqua dolore enim eiusmod
          laboris aliquip anim ullamco cupidatat enim eiusmod. Deserunt
          reprehenderit magna incididunt in aliqua commodo dolore laboris velit.
          Amet ad voluptate consequat nostrud ea anim adipisicing excepteur qui
          elit consequat reprehenderit minim cupidatat. Sunt fugiat laboris aute
          Lorem nulla. Do magna sit occaecat laborum et esse sunt quis.
        </p>
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurParametrageSourceIndicateur;
