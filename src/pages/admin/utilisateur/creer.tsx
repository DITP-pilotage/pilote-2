import { GetServerSidePropsContext } from 'next';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageUtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire';
import RécupérerListeProfilUseCase from '@/server/usecase/profil/RécupérerListeProfilUseCase';
import { Profil } from '@/server/domain/profil/Profil.interface';

interface NextPageCréerUtilisateurProps {
  profils: Profil[]
}

export default function NextPageCréerUtilisateur({  profils } : NextPageCréerUtilisateurProps) {
  return (
    <PageUtilisateurFormulaire
      profils={profils}
    />
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

  const profils = await new RécupérerListeProfilUseCase().run();

  return {
    props: {
      profils,
    },
  };
}
