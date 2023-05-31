import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { dependencies } from '@/server/infrastructure/Dependencies';
import PageUtilisateur from '@/components/PageUtilisateur/PageUtilisateur';

interface NextPageAdminUtilisateurProps {
  utilisateur: Utilisateur
}
export default function NextPageAdminUtilisateur({ utilisateur } :NextPageAdminUtilisateurProps) {
  return (
    <PageUtilisateur utilisateur={utilisateur} />
  );
}

export async function getServerSideProps({ req, res, params } :GetServerSidePropsContext<{ id :Utilisateur['id'] }>) {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };

  //TODO : checker le droit de la personne sur l'utilisateur avec ses habilitation
  const habilitation = new Habilitation(session.habilitations);
  const utilisateurDemandé = await dependencies.getUtilisateurRepository().getById(params.id);

  if (!utilisateurDemandé || !habilitation.peutConsulterUnUtilisateur(
    utilisateurDemandé?.habilitations.lecture.chantiers,
    utilisateurDemandé?.habilitations.lecture.territoires)
  ) {
    return { props: {} };
  }
  
  return {
    props: {
      utilisateur: utilisateurDemandé,
    },
  };
}
