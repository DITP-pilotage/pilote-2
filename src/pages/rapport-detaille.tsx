import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { PublicationsGroupéesParChantier } from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from '@/server/usecase/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from '@/server/usecase/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';

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
  if (process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE !== 'true') {
    return;
  }
  
  return (
    <>
      <Head>
        <title>
          Rapport détaillé - PILOTE
        </title>
      </Head>
      <PageRapportDétaillé
        chantiers={chantiers}
        codeInsee={codeInsee}
        détailsIndicateursGroupésParChantier={détailsIndicateursGroupésParChantier}
        indicateursGroupésParChantier={indicateursGroupésParChantier}
        maille={maille}
        publicationsGroupéesParChantier={publicationsGroupéesParChantier}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  if (process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE !== 'true') {
    res.setHeader('location', '/');
    res.statusCode = 302;
    res.end();
    return;
  }

  if (!query.maille || !query.codeInsee)
    return { props: {} };

  const { maille, codeInsee } = query as { maille: Maille, codeInsee: CodeInsee };

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };

  const chantierRepository = dependencies.getChantierRepository();

  const habilitation = new Habilitation(session.habilitations);

  const chantiers = await chantierRepository.getListe(habilitation);
  const chantiersIds = chantiers.map(chantier => chantier.id);

  const indicateursRepository = dependencies.getIndicateurRepository();
  const indicateursGroupésParChantier = await indicateursRepository.récupérerGroupésParChantier(chantiersIds, maille, codeInsee);
  const détailsIndicateursGroupésParChantier = await indicateursRepository.récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds, maille, codeInsee);

  const synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository();
  const synthèsesDesRésultatsGroupéesParChantier = await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(chantiersIds, maille, codeInsee);
  
  let décisionStratégiquesGroupéesParChantier: Record<string, DécisionStratégique | null> = Object.fromEntries(chantiersIds.map(id => [id, null]));
  if (habilitation.peutAccéderAuTerritoire('NAT-FR')) {
    const décisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository();
    décisionStratégiquesGroupéesParChantier = await décisionStratégiqueRepository.récupérerLesPlusRécentesGroupéesParChantier(chantiersIds);
  }

  const commentairesGroupésParChantier = await new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase().run(chantiersIds, maille, codeInsee);

  const objectifsGroupésParChantier = await new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase().run(chantiersIds);

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
