import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

interface NextPageRapportDétailléProps {
  chantiers: Chantier[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
}

export default function NextPageAccueil({ chantiers, indicateursGroupésParChantier }: NextPageRapportDétailléProps) {
  return (
    <PageRapportDétaillé
      chantiers={chantiers}
      indicateursGroupésParChantier={indicateursGroupésParChantier}
    />
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.habilitation) {
    return { props: {} };
  }

  const maille = 'nationale';
  const codeInsee = 'FR';

  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe(session.habilitation, SCOPE_LECTURE);
  const indicateursRepository = dependencies.getIndicateurRepository();
  const indicateursGroupésParChantier = await indicateursRepository.récupérerGroupésParChantier(maille, codeInsee);

  return {
    props: {
      chantiers,
      indicateursGroupésParChantier,
    },
  };
}
