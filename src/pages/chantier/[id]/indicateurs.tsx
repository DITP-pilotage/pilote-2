import { GetServerSidePropsResult } from 'next';
import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierInformations } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import usePageChantier from '@/components/PageChantier/usePageChantier';

interface NextPageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[],
}

type GetServerSideProps = GetServerSidePropsResult<NextPageImportIndicateurProps>;
type Params = {
  id: Chantier['id'],
};

export async function getServerSideProps({
  params,
  req,
  res,
}: GetServerSidePropsContext<Params>): Promise<GetServerSideProps> {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    throw new Error('Not connected?');
  }

  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.récupérer(params.id, session.habilitations);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs = await indicateurRepository.récupérerParChantierId(params.id);

  return {
    props: {
      indicateurs,
      chantierInformations: {
        id: chantier.id,
        nom: chantier.nom,
      },
    },
  };
}

export default function NextPageImportIndicateur({
  chantierInformations,
  indicateurs,
}: NextPageImportIndicateurProps) {
  const { détailsIndicateurs } = usePageChantier(chantierInformations.id);

  return (
    <>
      <Head>
        <title>
          {`Mettre à jour les données - Chantier ${chantierInformations.id.replace('CH-', '')} - PILOTE`}
        </title>
      </Head>
      <PageImportIndicateur
        chantierInformations={chantierInformations}
        détailsIndicateurs={détailsIndicateurs}
        indicateurs={indicateurs}
      />
    </>
  );
}
