import { GetServerSidePropsContext } from 'next';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { PageCréerUtilisateurAide } from '@/components/PageCreerUtilisateurAide/PageCréerUtilisateurAide';

export default function NextPageCréerUtilisateurAide() {
  return (
    <PageCréerUtilisateurAide />
  );
}

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
