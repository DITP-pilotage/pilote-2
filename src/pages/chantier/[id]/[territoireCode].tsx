import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { getServerSession } from 'next-auth/next';
import { FunctionComponent } from 'react';
import assert from 'node:assert/strict';
import PageChantier from '@/components/PageChantier/PageChantier';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { ChantierInformations } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { NonAutorisé } from '@/server/utils/errors';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import ChoixTerritoire from '@/components/PageChantier/ChoixTerritoire/ChoixTerritoire';
import calculerChantierAvancements from '@/client/utils/chantier/avancement/calculerChantierAvancementsNew';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import { convertitEnPondération } from '@/client/utils/ponderation/ponderation';
import { IndicateurPondération } from '@/components/PageChantier/PageChantier.interface';
import { CommentaireChantierContrat } from '@/server/chantiers/app/contrats/CommentaireChantierContrat';
import { DecisionStrategiqueChantierContrat } from '@/server/chantiers/app/contrats/DecisionStrategiqueChantierContrat';
import { ObjectifChantierContrat } from '@/server/chantiers/app/contrats/ObjectifChantierContrat';
import RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase
  from '@/server/usecase/chantier/synthèse/RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase';
import { SynthèseDesRésultatsContrat } from '@/server/chantiers/app/contrats/SynthèseDesRésultatsContrat';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase
  from '@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase
  from '@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase';
import RécupérerDécisionStratégiqueLaPlusRécenteUseCase
  from '@/server/usecase/chantier/décision/RécupérerDécisionStratégiqueLaPlusRécenteUseCase';
import RécupérerDétailsIndicateursUseCase
  from '@/server/usecase/chantier/indicateur/RécupérerDétailsIndicateursUseCase';
import {
  DétailsIndicateurs,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import RécupérerStatistiquesAvancementChantiersUseCase
  from '@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase';
import {
  presenterEnAvancementsStatistiquesAccueilContrat,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { AvancementChantierContrat } from '@/components/PageChantier/AvancementChantier';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { CoordinateurTerritorial, ResponsableLocal } from '@/server/domain/territoire/Territoire.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import {
  ListerDétailsIndicateurTerritoireUseCase,
} from '@/server/usecase/chantier/indicateur/ListerDétailsIndicateurTerritoireUseCase';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import {
  getAnneeDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule';
import { configuration } from '@/config';
import { CartographieType } from '@/components/PageChantier/Cartes/Cartes';
import { CartographieIndicateurType } from '@/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails';

interface NextPageChantierProps {
  indicateurs: Indicateur[],
  chantierInformations: ChantierInformations,
  mailleQuery: MailleInterne
  mailleSelectionnee: MailleInterne
  territoireCode: string
  territoiresCompares: string[]
  profil: ProfilCode
  synthèseDesRésultats: SynthèseDesRésultatsContrat
  commentaires: CommentaireChantierContrat
  objectifs: ObjectifChantierContrat
  décisionStratégique: DecisionStrategiqueChantierContrat
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: Record<string, DétailsIndicateurTerritoire>
  avancements: AvancementChantierContrat
  indicateurPondérations: IndicateurPondération[]
  chantier: Chantier
  listeResponsablesLocaux: ResponsableLocal[]
  listeCoordinateursTerritorials: CoordinateurTerritorial[]
  jalon: number
  cartographieGaucheChantier: CartographieType
  cartographieDroiteChantier: CartographieType
  cartographieDroiteIndicateur: CartographieIndicateurType
  cartographieGaucheIndicateur: CartographieIndicateurType
}

const redirigeLaPage = (destination: string) => ({
  redirect: {
    destination,
    permanent: true,
  },
});

export const getServerSideProps: GetServerSideProps<NextPageChantierProps> = async ({ req, res, query }) => {
  if (!query?.id) {
    return {
      notFound: true,
    };
  }

  const chantierId = query.id as string;
  const jalon = Number.parseInt(query.jalon as string) || getAnneeDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente);
  const cartographieGaucheChantier = query.carteChG as CartographieType || 'avancementMandat';
  const cartographieDroiteChantier = query.carteChD as CartographieType || 'meteo';
  const cartographieGaucheIndicateur = query.carteIndG as CartographieIndicateurType || 'avancementMandat';
  const cartographieDroiteIndicateur = query.carteIndD as CartographieIndicateurType || 'valeurActuelle';

  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est obligatoire pour afficher la page d\'accueil');
  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

  const territoireCode = query.territoireCode as string;
  const territoiresCompares = (query.territoiresCompares || '').length > 0 ? (query.territoiresCompares as string).split(',').filter(Boolean) : [];

  const {
    maille: mailleTerritoireSelectionnee,
  } = territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleQuery = query.maille as MailleInterne || 'departementale';

  const mailleSelectionnee = mailleTerritoireSelectionnee === 'NAT'
    ? mailleQuery
    : mailleTerritoireSelectionnee === 'DEPT' ? 'departementale' : 'regionale';

  const territoireRepository = dependencies.getTerritoireRepository();
  const territoireSélectionné = await territoireRepository.récupérer(territoireCode);
  const territoireCodes = territoiresCompares.length > 0 ? [...territoiresCompares, territoireCode] : [territoireCode];

  try {
    const [
      chantier,
      indicateurs,
      synthèseDesRésultats,
      commentaires,
      objectifs,
      décisionStratégique,
      détailsIndicateurs,
      avancementsAgrégés,
      valeurFFPpgArchive,
    ] = await Promise.all([
      new RécupérerChantierUseCase(
        dependencies.getChantierRepository(),
        dependencies.getMinistèreRepository(),
        dependencies.getTerritoireRepository(),
      ).run(chantierId, session.habilitations, session.profil, jalon),
      dependencies.getIndicateurRepository().récupérerParChantierId(chantierId),
      new RécupérerSynthèseDesRésultatsLaPlusRécenteUseCase(dependencies.getSynthèseDesRésultatsRepository()).run(chantierId, territoireCode, session.habilitations),
      new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getCommentaireRepository()).run([chantierId], territoireCode, session.habilitations),
      new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getObjectifRepository()).run([chantierId], session.habilitations),
      new RécupérerDécisionStratégiqueLaPlusRécenteUseCase(dependencies.getDécisionStratégiqueRepository()).run(chantierId, session.habilitations).catch(() => null),
      new RécupérerDétailsIndicateursUseCase(dependencies.getIndicateurRepository()).run(chantierId, territoireCodes, session.habilitations, jalon),
      new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository()).run([chantierId], mailleQuery, session.habilitations).then(presenterEnAvancementsStatistiquesAccueilContrat),
      new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_PPG_ARCHIVE' }),
    ]);

    assert(valeurFFPpgArchive || chantier.statut !== 'ARCHIVE', 'La page n\'est pas disponible');

    const chantierTerritoireSélectionné = chantier.mailles[territoireSélectionné.maille ?? 'nationale'][territoireCode];

    if (!chantierTerritoireSélectionné.estApplicable || (!chantier.estTerritorialisé && mailleTerritoireSelectionnee !== 'NAT')) {
      const destination = mailleTerritoireSelectionnee === 'DEPT'
        ? `/chantier/${chantierId}/${territoireSélectionné.codeParent}?maille=regionale`
        : `/chantier/${chantierId}/NAT-FR`;

      return redirigeLaPage(destination);
    }

    const avancements = calculerChantierAvancements(
      chantier as unknown as ChantierRapportDetailleContrat,
      mailleSelectionnee,
      territoireCode,
      territoireSélectionné.codeParent,
      avancementsAgrégés ?? null,
    );

    const indicateurPondérations = !détailsIndicateurs || !territoireSélectionné
      ? []
      : (
        indicateurs
          .sort((indicateurA, indicateurB) => comparerIndicateur(indicateurA, indicateurB, détailsIndicateurs[indicateurA.id][territoireCode]?.pondération ?? null, détailsIndicateurs[indicateurB.id][territoireCode]?.pondération ?? null))
          .map(indicateur => ({
            pondération: convertitEnPondération(détailsIndicateurs[indicateur.id][territoireCode]?.pondération),
            nom: indicateur.nom,
            type: indicateur.type,
          }))
          .filter((indPond): indPond is IndicateurPondération => indPond.pondération !== null && indPond.pondération !== '0')
      );

    const listeResponsablesLocaux = chantierTerritoireSélectionné?.responsableLocal ?? [];
    const listeCoordinateursTerritorials = chantierTerritoireSélectionné?.coordinateurTerritorial ?? [];

    const listeIndicateurId = indicateurs.map(indicateur => indicateur.id);

    const detailsIndicateursTerritoire = await new ListerDétailsIndicateurTerritoireUseCase(dependencies.getIndicateurRepository()).run(listeIndicateurId, chantierId, session.habilitations, session.profil, jalon);

    return {
      props: {
        indicateurs,
        chantierInformations: {
          id: chantier.id,
          nom: chantier.nom,
          estUnChantierDROM: chantier.périmètreIds.includes('PER-018'),
        },
        territoireCode,
        territoiresCompares,
        profil: session.profil,
        mailleSelectionnee,
        mailleQuery,
        synthèseDesRésultats,
        commentaires,
        objectifs,
        décisionStratégique,
        détailsIndicateurs,
        detailsIndicateursTerritoire,
        avancements,
        indicateurPondérations,
        chantier,
        listeResponsablesLocaux,
        listeCoordinateursTerritorials,
        jalon,
        cartographieGaucheChantier,
        cartographieDroiteChantier,
        cartographieDroiteIndicateur,
        cartographieGaucheIndicateur,
      },
    };
  } catch (error) {
    if (error instanceof NonAutorisé) {
      return { notFound: true };
    } else {
      throw error;
    }
  }
};

const NextPageChantier: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  indicateurs,
  chantierInformations,
  territoireCode,
  territoiresCompares,
  profil,
  mailleSelectionnee,
  mailleQuery,
  synthèseDesRésultats,
  commentaires,
  objectifs,
  décisionStratégique,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  avancements,
  indicateurPondérations,
  chantier,
  listeResponsablesLocaux,
  listeCoordinateursTerritorials,
  jalon,
  cartographieDroiteChantier,
  cartographieGaucheChantier,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
}) => {
  const estUnProfilDROM = profil === ProfilEnum.DROM;
  const estTerritoireNational = territoireCode === 'NAT-FR';

  return (
    <>
      <Head>
        <title>
          {`Chantier ${chantierInformations.id.replace('CH-', '')} - ${chantierInformations.nom} - PILOTE`}
        </title>
      </Head>
      {
        estTerritoireNational && estUnProfilDROM && !chantierInformations.estUnChantierDROM ? (
          <ChoixTerritoire
            chantier={chantier}
            mailleQuery={mailleQuery}
            mailleSelectionnee={mailleSelectionnee}
            territoireCode={territoireCode}
          />
        ) : (
          <PageChantier
            avancements={avancements}
            cartographieDroiteChantier={cartographieDroiteChantier}
            cartographieDroiteIndicateur={cartographieDroiteIndicateur}
            cartographieGaucheChantier={cartographieGaucheChantier}
            cartographieGaucheIndicateur={cartographieGaucheIndicateur}
            chantier={chantier}
            commentaires={commentaires}
            detailsIndicateursTerritoire={detailsIndicateursTerritoire}
            décisionStratégique={décisionStratégique as DecisionStrategiqueChantierContrat}
            détailsIndicateurs={détailsIndicateurs}
            indicateurPondérations={indicateurPondérations}
            indicateurs={indicateurs}
            jalon={jalon}
            listeCoordinateursTerritorials={listeCoordinateursTerritorials}
            listeResponsablesLocaux={listeResponsablesLocaux}
            mailleQuery={mailleQuery}
            mailleSelectionnee={mailleSelectionnee}
            objectifs={objectifs}
            synthèseDesRésultats={synthèseDesRésultats}
            territoireCode={territoireCode}
            territoiresCompares={territoiresCompares}
          />
        )
      }
    </>
  );
};

export default NextPageChantier;
