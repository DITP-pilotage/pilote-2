import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import PageUtilisateur from '@/components/PageUtilisateur/PageUtilisateur';
import RécupérerUnUtilisateurUseCase from '@/server/usecase/utilisateur/RécupérerUnUtilisateurUseCase';
import RécupérerChantiersUseCase from '@/server/usecase/chantier/RécupérerChantiersUseCase';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageAdminUtilisateurProps {
  utilisateur: Utilisateur
  chantiers: Record<Chantier['id'], Chantier['nom']>
}
export default function NextPageAdminUtilisateur({ utilisateur, chantiers } :NextPageAdminUtilisateurProps) {
  return (
    <PageUtilisateur
      chantiers={chantiers}
      utilisateur={utilisateur}
    />
  );
}

export async function getServerSideProps({ req, res, params } :GetServerSidePropsContext<{ id :Utilisateur['id'] }>) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  const session = await getServerSession(req, res, authOptions);

  if (!params?.id || !session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const utilisateurDemandé = await new RécupérerUnUtilisateurUseCase().run(session.habilitations, params.id);
  const chantiersExistants = await new RécupérerChantiersUseCase().run();
  if (!utilisateurDemandé) {
    return redirigerVersPageAccueil;
  }

  let chantiers: Record<Chantier['id'], Chantier['nom']> = {};
  chantiersExistants.forEach(chantier => chantiers[chantier.id] = chantier.nom);

  return {
    props: {
      utilisateur: utilisateurDemandé,
      chantiers,
    },
  };
}
