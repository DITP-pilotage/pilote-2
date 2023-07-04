import { GetServerSidePropsContext } from 'next';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageUtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire';

export default function NextPageCréerUtilisateur() {
  return (
    <PageUtilisateurFormulaire />
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

  if (!habilitations.peutCréerUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }


  return {
    props: {},
  };
}
