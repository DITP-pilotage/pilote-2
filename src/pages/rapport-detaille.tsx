import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Publication } from '@/components/_commons/Publication/Publication.interface';

interface NextPageRapportDétailléProps {
  chantiers: Chantier[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: Record<Chantier['id'], Publication>
  synthèsesDesRésultatsGroupéesParChantier: Record<Chantier['id'], SynthèseDesRésultats>
}

export default function NextPageAccueil({
  chantiers,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  synthèsesDesRésultatsGroupéesParChantier,
}: NextPageRapportDétailléProps) {
  return (
    <PageRapportDétaillé
      chantiers={chantiers}
      détailsIndicateursGroupésParChantier={détailsIndicateursGroupésParChantier}
      indicateursGroupésParChantier={indicateursGroupésParChantier}
      publicationsGroupéesParChantier={publicationsGroupéesParChantier}
      synthèsesDesRésultatsGroupéesParChantier={synthèsesDesRésultatsGroupéesParChantier}
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
  const détailsIndicateursGroupésParChantier = await indicateursRepository.récupérerDétailsGroupésParChantierEtParIndicateur(maille, codeInsee);
  const synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository();
  const synthèsesDesRésultatsGroupéesParChantier = await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(maille, codeInsee);    
  const commentaireRepository = dependencies.getCommentaireRepository();
  const commentairesGroupésParChantier = await commentaireRepository.récupérerLesPlusRécentesGroupéesParChantier(maille, codeInsee);
  console.log(commentairesGroupésParChantier);
  

  return {
    props: {
      chantiers,
      indicateursGroupésParChantier,
      détailsIndicateursGroupésParChantier,
      publicationsGroupéesParChantier: {},
      synthèsesDesRésultatsGroupéesParChantier,
    },
  };
}