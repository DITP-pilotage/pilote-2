import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { SCOPE_LECTURE } from '@/server/domain/identité/Habilitation';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { PublicationsGroupéesParChantier } from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';

interface NextPageRapportDétailléProps {
  chantiers: Chantier[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
}

export default function NextPageRapportDétaillé({
  chantiers,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
}: NextPageRapportDétailléProps) {
  return (
    process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE === 'true' &&
    <PageRapportDétaillé
      chantiers={chantiers}
      détailsIndicateursGroupésParChantier={détailsIndicateursGroupésParChantier}
      indicateursGroupésParChantier={indicateursGroupésParChantier}
      publicationsGroupéesParChantier={publicationsGroupéesParChantier}
    />
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  if (process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE !== 'true') {
    res.setHeader('location', '/');
    res.statusCode = 302;
    res.end();
    return;
  }

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
  const objectifRepository = dependencies.getObjectifRepository();
  const objectifsGroupésParChantier = await objectifRepository.récupérerLesPlusRécentsGroupésParChantier();
  const décisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository();
  const décisionStratégiquesGroupéesParChantier = await décisionStratégiqueRepository.récupérerLesPlusRécentesGroupéesParChantier();

  return {
    props: {
      chantiers,
      indicateursGroupésParChantier,
      détailsIndicateursGroupésParChantier,
      publicationsGroupéesParChantier: {
        commentaires: commentairesGroupésParChantier,
        synthèsesDesRésultats: synthèsesDesRésultatsGroupéesParChantier,
        objectifs: objectifsGroupésParChantier,
        décisionStratégique: décisionStratégiquesGroupéesParChantier,
      },
    },
  };
}
