import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next';
import PageChantier from '@/components/PageChantier/PageChantier';

import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

import { dependencies } from '@/server/infrastructure/Dependencies';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

interface NextPageChantierProps {
  habilitation: Utilisateur['scopes'],
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


export async function getServerSideProps(context: GetServerSidePropsContext<{ id: Chantier['id'] }>) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    throw new Error('Not connected?');
  }

  const habilitation = session.habilitation;

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParChantierId(context.params!.id);

  return {
    props: {
      indicateurs,
      habilitation,
    },
  };
}
