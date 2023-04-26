import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitation, SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageRapportDétailléProps {
  chantiers: Chantier[]
  habilitation: Habilitation
}

export default function NextPageAccueil({ chantiers, habilitation }: NextPageRapportDétailléProps) {
  return (
    <PageRapportDétaillé
      chantiers={chantiers}
      habilitation={habilitation}
    />
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.habilitation) {
    return { props: {} };
  }
  const habilitation = session.habilitation;
  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe(session.habilitation, SCOPE_LECTURE);

  return {
    props: {
      chantiers,
      habilitation,
    },
  };
}
