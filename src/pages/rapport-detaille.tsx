import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { Maille as MaillePrisma } from '@prisma/client';
import { GetServerSideProps } from 'next';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { PublicationsGroupéesParChantier } from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase
  from '@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase
  from '@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import RécupérerChantiersAccessiblesEnLectureUseCase
  from '@/server/usecase/chantier/RécupérerChantiersAccessiblesEnLectureUseCase';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import {
  ChantierRapportDetailleContrat,
  presenterEnChantierRapportDetaille,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

interface NextPageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[]
  ministères: Ministère[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  maille: Maille
  codeInsee: CodeInsee
}

export const getServerSideProps: GetServerSideProps<NextPageRapportDétailléProps> = async ({ req, res, query }) =>  {
  if (process.env.NEXT_PUBLIC_FF_RAPPORT_DETAILLE !== 'true') {
    return {
      redirect: {
        statusCode: 302,
        destination: '/',
      },
    };
  }

  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est manquant');
  assert(session?.habilitations, "La session ne dispose d'aucune habilitation");

  const territoireCode = query.territoireCode as string;
  const { maille: mailleBrute, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);
  const maille = NOMS_MAILLES[mailleBrute as MaillePrisma];

  const habilitation = new Habilitation(session.habilitations);

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDatesDeMàjRepository(),
    dependencies.getMinistèreRepository(),
    dependencies.getTerritoireRepository(),
  )
    .run(session.habilitations, session.profil)
    .then(listeChantiersResult => listeChantiersResult.map(presenterEnChantierRapportDetaille));


  const chantiersIds = chantiers.map(chantier => chantier.id);

  const ministèreRepository = dependencies.getMinistèreRepository();
  const ministères = await ministèreRepository.getListePourChantiers(chantiersIds);

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

  const commentairesGroupésParChantier = await new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getCommentaireRepository()).run(chantiersIds, territoireCode, session.habilitations);

  const objectifsGroupésParChantier = await new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getObjectifRepository()).run(chantiersIds, session.habilitations);

  return {
    props: {
      chantiers,
      ministères,
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
};

export default function NextPageRapportDétaillé({
  chantiers,
  ministères,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  maille,
  codeInsee,
}: NextPageRapportDétailléProps) {
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
        ministères={ministères}
        publicationsGroupéesParChantier={publicationsGroupéesParChantier}
      />
    </>
  );
}
