import { GetServerSidePropsContext } from 'next';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import RécupérerListeUtilisateursUseCase from '@/server/usecase/utilisateur/RécupérerListeUtilisateursUseCase';

interface NextPageUtilisateursProps {
  utilisateurs: Utilisateur[]
}

export default function NextPageUtilisateurs({ utilisateurs } : NextPageUtilisateursProps) {
  return null;
  // return (
  //   <PageUtilisateurs utilisateurs={utilisateurs} />
  // );
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

  const utilisateurs = await new RécupérerListeUtilisateursUseCase().run(session.habilitations);

  //utilisateurs.forEach(u => console.log(u.habilitations.lecture.chantiers.includes('CH-0001')));

  return {
    props: {
      utilisateurs,
    },
  };
}
