import { GetServerSidePropsContext } from 'next/types';
import Head from 'next/head';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import PageUtilisateur from '@/components/PageUtilisateur/PageUtilisateur';
import RécupérerUnUtilisateurUseCase from '@/server/usecase/utilisateur/RécupérerUnUtilisateurUseCase';
import { commenceParUneVoyelle } from '@/client/utils/strings';
import { dependencies } from '@/server/infrastructure/Dependencies';

export interface NextPageAdminUtilisateurProps {
  utilisateur: Utilisateur,
}

export default function NextPageAdminUtilisateur({ utilisateur } : NextPageAdminUtilisateurProps) {
  return (
    <>
      <Head>
        <title>
          Compte 
          {' '}
          {commenceParUneVoyelle(utilisateur.prénom) ? "d'" : 'de '}
          {utilisateur.prénom}
          {' '}
          {utilisateur.nom.toUpperCase()}
          {' '}
          - PILOTE
        </title>
      </Head>
      <PageUtilisateur
        utilisateur={utilisateur}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, params } :GetServerSidePropsContext<{ id :Utilisateur['id'] }>) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  const session = await getServerAuthSession({ req, res });

  if (!params?.id || !session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const utilisateurDemandé = await new RécupérerUnUtilisateurUseCase(dependencies.getUtilisateurRepository()).run(params.id);

  if (!utilisateurDemandé) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {
      utilisateur: utilisateurDemandé,
    },
  };
}
