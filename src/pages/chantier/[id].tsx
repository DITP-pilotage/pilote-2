import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import PageChantier from '@/components/PageChantier/PageChantier';

import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierId, SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { Objectifs } from '@/server/domain/objectif/Objectif.interface';

import { dependencies } from '@/server/infrastructure/Dependencies';
import logger from '@/server/infrastructure/logger';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';

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
