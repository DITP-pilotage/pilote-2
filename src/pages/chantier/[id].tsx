import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import PageChantier from '@/components/PageChantier/PageChantier';

import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierId, SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[],
  modeÉcriture: boolean
}

export default function NextPageChantier({ chantier, indicateurs, modeÉcriture }: NextPageChantierProps) {
  return (
    <PageChantier
      chantier={chantier}
      indicateurs={indicateurs}
      modeÉcriture={modeÉcriture}
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
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id, session.habilitation, SCOPE_LECTURE);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(params.id);

  const modeÉcriture = true;
  return {
    props: {
      chantier,
      indicateurs,
      modeÉcriture,
      habilitation, // -> surt le front, les function d'haibilitation sont utiliés        -> if checkChantierScope(habilitation, chantier, scope)
    },
  };
}
