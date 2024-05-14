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
import InitialiserNouvelIndicateurUseCase
  from '@/server/parametrage-indicateur/usecases/InitialiserNouvelIndicateurUseCase';
import RécupérerChantiersSynthétisésUseCase from '@/server/usecase/chantier/RécupérerChantiersSynthétisésUseCase';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export interface NextPageAdminUtilisateurProps {
  indicateur: MetadataParametrageIndicateurContrat,
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat
  estUneCréation: boolean
  modificationReussie: boolean
  creationReussie: boolean
  chantiers: ChantierSynthétisé[]
}

export default function NextPageAdminIndicateur({
  indicateur,
  mapInformationMetadataIndicateur,
  estUneCréation,
  modificationReussie,
  creationReussie,
  chantiers,
}: NextPageAdminUtilisateurProps) {
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
        chantiers={chantiers}
        creationReussie={creationReussie}
        estUneCréation={estUneCréation}
        indicateur={indicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
        modificationReussie={modificationReussie}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, params, query }: GetServerSidePropsContext<{
  id: Utilisateur['id'],
  _action?: string
}>) {

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

  let indicateurDemandé: MetadataParametrageIndicateurContrat;
  let creationReussie = query._action === 'creation-reussie';
  let modificationReussie = query._action === 'modification-reussie';
  let estUneCréation = query._action === 'creer-indicateur';
  if (estUneCréation) {
    indicateurDemandé = presenterEnMetadataParametrageIndicateurContrat(await new InitialiserNouvelIndicateurUseCase(dependencies.getInformationMetadataIndicateurRepository()).run(params.id));
  } else {
    indicateurDemandé = presenterEnMetadataParametrageIndicateurContrat(await new RécupérerUnIndicateurUseCase(dependencies.getMetadataParametrageIndicateurRepository()).run(params.id));
    if (!indicateurDemandé) {
      return redirigerVersPageAccueil;
    }
  }

  const récupérerChantiersSynthétisésUseCase = new RécupérerChantiersSynthétisésUseCase(dependencies.getChantierRepository());
  const chantiers = await récupérerChantiersSynthétisésUseCase.run(session.habilitations);

  const mapInformationMetadataIndicateur = presenterEnMapInformationMetadataIndicateurContrat(new RécupérerInformationMetadataIndicateurUseCase(dependencies.getInformationMetadataIndicateurRepository()).run());

  return {
    props: {
      indicateur: indicateurDemandé,
      mapInformationMetadataIndicateur,
      chantiers,
      estUneCréation,
      creationReussie,
      modificationReussie,
    },
  };
}
