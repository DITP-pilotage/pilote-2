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
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';

interface NextPageRapportDétailléProps {
  chantiers: Chantier[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  maille: Maille
  codeInsee: CodeInsee
}

export default function NextPageRapportDétaillé({
  chantiers,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  maille,
  codeInsee,
}: NextPageRapportDétailléProps) {
  
  return (
    process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE === 'true' &&
    <PageRapportDétaillé
      chantiers={chantiers}
      codeInsee={codeInsee}
      détailsIndicateursGroupésParChantier={détailsIndicateursGroupésParChantier}
      indicateursGroupésParChantier={indicateursGroupésParChantier}
      maille={maille}
      publicationsGroupéesParChantier={publicationsGroupéesParChantier}
    />
  );
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  if (process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE !== 'true') {
    res.setHeader('location', '/');
    res.statusCode = 302;
    res.end();
    return;
  }

  if (!query.maille || !query.codeInsee) return { props: {} };
  const { maille, codeInsee } = query as { maille: Maille, codeInsee: CodeInsee };

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.habilitation) return { props: {} };

  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe(session.habilitation, SCOPE_LECTURE);
  const chantiersIds = chantiers.map(chantier => chantier.id);

  const indicateursRepository = dependencies.getIndicateurRepository();
  const indicateursGroupésParChantier = await indicateursRepository.récupérerGroupésParChantier(chantiersIds, maille, codeInsee);
  const détailsIndicateursGroupésParChantier = await indicateursRepository.récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds, maille, codeInsee);

  const synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository();
  const synthèsesDesRésultatsGroupéesParChantier = await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(chantiersIds, maille, codeInsee);

  const commentaireRepository = dependencies.getCommentaireRepository();
  const commentairesGroupésParChantier = await commentaireRepository.récupérerLesPlusRécentsGroupésParChantier(chantiersIds, maille, codeInsee);

  const objectifRepository = dependencies.getObjectifRepository();
  const objectifsGroupésParChantier = await objectifRepository.récupérerLesPlusRécentsGroupésParChantier(chantiersIds);

  const décisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository();
  const décisionStratégiquesGroupéesParChantier = await décisionStratégiqueRepository.récupérerLesPlusRécentesGroupéesParChantier(chantiersIds);

  return {
    props: {
      chantiers,
      indicateursGroupésParChantier,
      détailsIndicateursGroupésParChantier,
      maille,
      codeInsee,
      publicationsGroupéesParChantier: {
        commentaires: commentairesGroupésParChantier,
        synthèsesDesRésultats: synthèsesDesRésultatsGroupéesParChantier,
        objectifs: objectifsGroupésParChantier,
        décisionStratégique: décisionStratégiquesGroupéesParChantier,
      },
    },
  };
}
