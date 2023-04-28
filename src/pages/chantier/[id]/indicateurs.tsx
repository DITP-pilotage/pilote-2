import { GetServerSidePropsResult } from 'next';
import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import logger from '@/server/infrastructure/logger';
import { Habilitation, SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import usePageChantier from '@/components/PageChantier/usePageChantier';

interface NextPageImportIndicateurProps {
  chantierInformation: ChantierInformation
  indicateurs: Indicateur[],
  habilitation: Habilitation
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
    logger.error('Not connected?');
    // TODO: On renvoie une erreur ? Quelle erreur ?
    throw new Error('Not connected?');
  }

  const { habilitation } = session;

  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id, habilitation, SCOPE_LECTURE);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs = await indicateurRepository.récupérerParChantierId(params.id);

  return {
    props: {
      indicateurs,
      habilitation,
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
  habilitation,
}: NextPageImportIndicateurProps) {
  const { détailsIndicateurs } = usePageChantier(chantierInformation.id, habilitation);

  return (
    <PageImportIndicateur
      chantierInformation={chantierInformation}
      détailsIndicateurs={détailsIndicateurs}
      indicateurs={indicateurs}
    />
  );
}
