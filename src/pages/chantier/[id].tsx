import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { Objectifs } from '@/server/domain/objectif/Objectif.interface';

import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import logger from '@/server/infrastructure/logger';
import { ChantierId } from '@/server/domain/identité/Habilitation';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  objectifs: Objectifs
}

export default function NextPageChantier({ chantier, indicateurs, objectifs }: NextPageChantierProps) {
  return (
    <PageChantier
      chantier={chantier}
      indicateurs={indicateurs}
      objectifs={objectifs}
    />
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const params: { params: { id: ChantierId } } = context.params;
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    logger.error('Not connected?');
    // TODO: On renvoie une erreur ? Quelle erreur ?
    throw new Error('Not connected?');
  }
  const habilitation = session.habilitation;

  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id, session.habilitation, 'lecture');

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(params.id);

  const objectifs: Objectifs = {
    notreAmbition: null,
    déjàFait: null,
    àFaire: null,
  };

  return {
    props: {
      chantier,
      indicateurs,
      objectifs,
      habilitation, // -> surt le front, les function d'haibilitation sont utiliés        -> if checkChantierScope(habilitation, chantier, scope)
    },
  };
}
