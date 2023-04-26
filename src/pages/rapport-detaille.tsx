import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageRapportDétailléProps {
  chantiers: Chantier[]
}

export default function NextPageAccueil({ chantiers }: NextPageRapportDétailléProps) {
  return (
    <PageRapportDétaillé chantiers={chantiers} />
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return { props: {} };
  }
  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe(session.habilitation, SCOPE_LECTURE);

  return {
    props: {
      chantiers,
    },
  };
}
