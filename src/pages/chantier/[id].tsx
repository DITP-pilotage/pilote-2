import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import PageChantier from '@/components/PageChantier/PageChantier';

import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

import { dependencies } from '@/server/infrastructure/Dependencies';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

interface NextPageChantierProps {
  habilitations: Habilitation,
  indicateurs: Indicateur[],
}

export default function NextPageChantier({ indicateurs, habilitations }: NextPageChantierProps) {
  return (
    <PageChantier
      habilitations={habilitations}
      indicateurs={indicateurs}
    />
  );
}


export async function getServerSideProps(context: GetServerSidePropsContext<{ id: Chantier['id'] }>) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    throw new Error('Not connected?');
  }

  const habilitations = session.habilitations;

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(context.params!.id);

  return {
    props: {
      indicateurs,
      habilitations,
    },
  };
}
