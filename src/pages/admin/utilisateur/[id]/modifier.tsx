import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerUnUtilisateurUseCase from '@/server/usecase/utilisateur/RécupérerUnUtilisateurUseCase';
import PageModifierUtilisateur
  from '@/components/PageUtilisateurFormulaire/PageModifierUtilisateur/PageModifierUtilisateur';
import { commenceParUneVoyelle } from '@/client/utils/strings';
import { dependencies } from '@/server/infrastructure/Dependencies';

export interface NextPageModifierUtilisateurProps {
  utilisateur: Utilisateur
}

export default function NextPageModifierUtilisateur({ utilisateur }: NextPageModifierUtilisateurProps) {
  return (
    <>
      <Head>
        <title>
          Modifier le compte
          {' '}
          {commenceParUneVoyelle(utilisateur.prénom) ? "d'" : 'de '}
          {utilisateur.prénom}
          {' '}
          {utilisateur.nom.toUpperCase()}
          {' '}
          - PILOTE
        </title>
      </Head>
      <PageModifierUtilisateur utilisateur={utilisateur} />
    </>
  );
}

export async function getServerSideProps({ req, res, params } :GetServerSidePropsContext<{ id : Utilisateur['id'] }>) {
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

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerEtModifierUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  const utilisateurDemandé = await new RécupérerUnUtilisateurUseCase(dependencies.getUtilisateurRepository()).run(params.id);
  if (!utilisateurDemandé) {
    return redirigerVersPageAccueil;
  }

  if (!habilitations.peutAccéderAuxTerritoires(utilisateurDemandé.habilitations.lecture.territoires)) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {
      utilisateur: utilisateurDemandé,
    },
  };
}
