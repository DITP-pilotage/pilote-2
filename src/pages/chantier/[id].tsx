import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import PageChantier from '@/components/PageChantier/PageChantier';

import { ChantierId, Habilitation } from '@/server/domain/identité/Habilitation';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';

interface NextPageChantierProps {
  habilitation: Habilitation,
  indicateurs: Indicateur[],
}

export default function NextPageChantier({ indicateurs, habilitation }: NextPageChantierProps) {
  return (
    <PageChantier
      habilitation={habilitation}
      indicateurs={indicateurs}
    />
  );
}

type Params = {
  id: ChantierId,
};

export async function getServerSideProps(context: GetServerSidePropsContext<Params>) {
  const params = context.params as Params;

  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    logger.error('Not connected?');
    // TODO: On renvoie une erreur ? Quelle erreur ?
    throw new Error('Not connected?');
  }

  const habilitation = session.habilitation;

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(params.id);

  return {
    props: {
      indicateurs,
      habilitation,
    },
  };
}
