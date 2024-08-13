import { GetServerSidePropsContext } from 'next/types';
import Head from 'next/head';
import { FunctionComponent } from 'react';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import PageUtilisateur from '@/components/PageUtilisateur/PageUtilisateur';
import RécupérerUnUtilisateurUseCase from '@/server/usecase/utilisateur/RécupérerUnUtilisateurUseCase';
import {
  RecupererTokenAPIInformationUseCase,
} from '@/server/authentification/usecases/RecupererTokenAPIInformationUseCase';
import {
  presenterEnTokenAPIInformationContrat,
  TokenAPIInformationContrat,
} from '@/server/authentification/app/contrats/TokenAPIInformationContrat';
import { commenceParUneVoyelle } from '@/client/utils/strings';
import { dependencies } from '@/server/infrastructure/Dependencies';

export interface NextPageAdminUtilisateurProps {
  utilisateur: Utilisateur,
  tokenAPIInformation: TokenAPIInformationContrat
}

export async function getServerSideProps({ req, res, params }: GetServerSidePropsContext<{ id: Utilisateur['id'] }>) {
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

  const tokenAPIInformation = await new RecupererTokenAPIInformationUseCase({ tokenAPIInformationRepository: dependencies.getTokenAPIInformationRepository() }).run({ email: utilisateurDemandé.email }).then(tokenAPI => {
    return tokenAPI ? presenterEnTokenAPIInformationContrat(tokenAPI) : null;
  });

  return {
    props: {
      utilisateur: utilisateurDemandé,
      tokenAPIInformation,
    },
  };
}

const NextPageAdminUtilisateur: FunctionComponent<NextPageAdminUtilisateurProps> = ({ utilisateur, tokenAPIInformation }) => {
  return (
    <>
      <Head>
        <title>
          Compte
          {' '}
          {commenceParUneVoyelle(utilisateur.prénom) ? 'd\'' : 'de '}
          {utilisateur.prénom}
          {' '}
          {utilisateur.nom.toUpperCase()}
          {' '}
          - PILOTE
        </title>
      </Head>
      <PageUtilisateur
        tokenAPIInformation={tokenAPIInformation}
        utilisateur={utilisateur}
      />
    </>
  );
};

export default NextPageAdminUtilisateur;
