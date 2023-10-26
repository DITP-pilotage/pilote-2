import { GetServerSidePropsContext } from 'next/types';
import Head from 'next/head';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import {
  MetadataParametrageIndicateurContrat,
  presenterEnMetadataParametrageIndicateurContrat,
} from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import PageIndicateur from '@/components/PageIndicateur/PageIndicateur';
import RécupérerUnIndicateurUseCase from '@/server/parametrage-indicateur/usecases/RécupérerUnIndicateurUseCase';
import RécupérerInformationMetadataIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase';
import {
  MapInformationMetadataIndicateurContrat,
  presenterEnMapInformationMetadataIndicateurContrat,
} from '@/server/app/contrats/InformationMetadataIndicateurContrat';

export interface NextPageAdminUtilisateurProps {
  indicateur: MetadataParametrageIndicateurContrat,
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
}

export default function NextPageAdminIndicateur({ indicateur, mapInformationMetadataIndicateur } : NextPageAdminUtilisateurProps) {
  return (
    <>
      <Head>
        <title>
          Indicateur 
          {' '}
          {indicateur.indicId}
          - PILOTE
        </title>
      </Head>
      <PageIndicateur
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, params } :GetServerSidePropsContext<{ id: Utilisateur['id'] }>) {
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

  const indicateurDemandé = presenterEnMetadataParametrageIndicateurContrat(await new RécupérerUnIndicateurUseCase().run(params.id));
  if (!indicateurDemandé) {
    return redirigerVersPageAccueil;
  }

  const mapInformationMetadataIndicateur = await new RécupérerInformationMetadataIndicateurUseCase().run().then(result => presenterEnMapInformationMetadataIndicateurContrat(result));

  return {
    props: {
      indicateur: indicateurDemandé,
      mapInformationMetadataIndicateur,
    },
  };
}
