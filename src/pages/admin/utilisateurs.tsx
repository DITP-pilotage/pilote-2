import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageAdminUtilisateurs from '@/components/PageAdminUtilisateurs/PageAdminUtilisateurs';

export default function NextPageUtilisateurs() {
  return (
    <>
      <Head>
        <title>
          Gestion des comptes - PILOTE
        </title>
      </Head>
      <PageAdminUtilisateurs />
    </>
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerAuthSession({ req, res });
  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  if (!session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitation = new Habilitation(session.habilitations);
  if (!habilitation.peutConsulterLaListeDesUtilisateurs()) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
}
