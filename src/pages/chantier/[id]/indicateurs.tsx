import { GetServerSidePropsResult } from 'next';
import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import usePageChantier from '@/components/PageChantier/usePageChantier';

interface NextPageImportIndicateurProps {
  chantierInformation: ChantierInformation
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
  const chantier: Chantier = await chantierRepository.getById(params.id, session.habilitations);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs = await indicateurRepository.récupérerParChantierId(params.id);

  return {
    props: {
      indicateurs,
      chantierInformation: {
        id: chantier.id,
        nom: chantier.nom,
        axe: chantier.axe,
        ppg: chantier.ppg,
      },
    },
  };
}

export default function NextPageImportIndicateur({
  chantierInformation,
  indicateurs,
}: NextPageImportIndicateurProps) {
  const { détailsIndicateurs } = usePageChantier(chantierInformation.id);

  return (
    <PageImportIndicateur
      chantierInformation={chantierInformation}
      détailsIndicateurs={détailsIndicateurs}
      indicateurs={indicateurs}
    />
  );
}
