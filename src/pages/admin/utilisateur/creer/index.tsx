import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { FunctionComponent } from 'react';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageCréerUtilisateur from '@/components/PageUtilisateurFormulaire/PageCréerUtilisateur/PageCréerUtilisateur';

const NextPageCréerUtilisateur: FunctionComponent<{}> = () => {
  return (
    <>
      <Head>
        <title>
          Créer un compte - PILOTE
        </title>
      </Head>
      <PageCréerUtilisateur />
    </>
  );
};
export default NextPageCréerUtilisateur;

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  const session = await getServerAuthSession({ req, res });

  if (!session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerEtModifierUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
}
