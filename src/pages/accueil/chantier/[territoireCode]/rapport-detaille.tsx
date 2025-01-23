import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { FunctionComponent } from 'react';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import PageRapportDétaillé from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { PublicationsGroupéesParChantier } from '@/components/PageRapportDétaillé/PageRapportDétaillé.interface';
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase
  from '@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase';
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase
  from '@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import DécisionStratégique from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import RécupérerChantiersAccessiblesEnLectureUseCase
  from '@/server/chantiers/usecases/RécupérerChantiersAccessiblesEnLectureUseCaseRapportDetaille';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { ChantierRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Alerte from '@/server/domain/alerte/Alerte';
import RécupérerStatistiquesAvancementChantiersUseCase
  from '@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase';
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  presenterEnAvancementsStatistiquesAccueilContrat,
  RépartitionsMétéos,
} from '@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat';
import { AgrégateurListeChantiersParTerritoire } from '@/client/utils/chantier/agrégateurListeChantiers/agrégateur';
import { objectEntries } from '@/client/utils/objects/objects';
import Axe from '@/server/domain/axe/Axe.interface';
import {
  AgrégateurChantierRapportDetailleParTerritoire,
} from '@/client/utils/chantier/agrégateurRapportDetailleNew/agrégateur';
import { AvancementChantierRapportDetaille } from '@/components/PageRapportDétaillé/AvancementChantierRapportDetaille';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { TypeAlerteChantier } from '@/server/chantiers/app/contrats/TypeAlerteChantier';
import { Chantier } from '@/server/chantiers/domain/Chantier';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

interface NextPageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[]
  ministères: Ministère[]
  axes: Axe[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<string, DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  mailleQuery: MailleInterne
  mailleSelectionnee: MailleInterne
  listeAvancementsStatistiques: { id: string, avancementChantierRapportDetaille: AvancementChantierRapportDetaille }[]
  territoireCode: string
  filtresComptesCalculés: Record<TypeAlerteChantier, number>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
  estAutoriseAVoirLesBrouillons: boolean
  listeDonnéesCartographieAvancement: {
    id: string,
    donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat
  }[],
  listeDonnéesCartographieMétéo: {
    id: string,
    donnéesCartographieMétéo: CartographieDonnéesMétéo
  }[],
}

const PROFILS_AUTORISE_VOIR_BROUILLONS = new Set([ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE, ProfilEnum.DIR_PROJET, ProfilEnum.EQUIPE_DIR_PROJET]);

export const getServerSideProps: GetServerSideProps<NextPageRapportDétailléProps> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est manquant');
  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');
  const territoireCode = query.territoireCode as string;

  const { maille, codeInsee: codeInseeSelectionne } = territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleQuery = query.maille as MailleInterne || 'departementale';

  const mailleSelectionnee = maille === 'NAT'
    ? mailleQuery
    : maille === 'DEPT' ? 'departementale' : 'regionale';

  const mailleChantier = maille === 'NAT' ? 'nationale' : mailleSelectionnee;

  const filtres: FiltreQueryParams = {
    perimetres: query.perimetres ? (query.perimetres as string).split(',').filter(Boolean) : [],
    axes: query.axes ? (query.axes as string).split(',').filter(Boolean) : [],
    statut: query.statut === 'BROUILLON_ET_PUBLIE' ? ['BROUILLON', 'PUBLIE'] : !!query.statut ? [query.statut as string] : ['PUBLIE'],
    estTerritorialise: query.estTerritorialise === 'true',
    estBarometre: query.estBarometre === 'true',
    valeurDeLaRecherche: query.q as string,
  };

  const filtresAlertes = {
    estEnAlerteTauxAvancementNonCalculé: query.estEnAlerteTauxAvancementNonCalculé === 'true',
    estEnAlerteÉcart: query.estEnAlerteÉcart === 'true',
    estEnAlerteBaisse: query.estEnAlerteBaisse === 'true',
    estEnAlerteMétéoNonRenseignée: query.estEnAlerteMétéoNonRenseignée === 'true',
    estEnAlerteAbscenceTauxAvancementDepartemental: query.estEnAlerteAbscenceTauxAvancementDepartemental === 'true',
  };


  const [ministères, axes] = session.habilitations.lecture.chantiers.length === 0 ? [[], []] : (
    await Promise.all(
      [
        dependencies.getMinistèreRepository().getListePourChantiers(session.habilitations.lecture.chantiers),
        dependencies.getAxeRepository().getListePourChantiers(session.habilitations.lecture.chantiers),
      ],
    )
  );

  const habilitation = new Habilitation(session.habilitations);

  const territoireRepository = dependencies.getTerritoireRepository();
  const territoireSélectionné = await territoireRepository.récupérer(territoireCode);

  const sorting = query.sort ? JSON.parse(query.sort as string) as { id: string, desc: boolean } : {
    id: 'avancement',
    desc: false,
  };

  const mapAxes = new Map<string, Axe>(axes.map(axe => [axe.id, axe]));

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getTerritoireRepository(),
  )
    .run(session.habilitations, session.profil, territoireCode, mailleChantier || 'departementale', ministères, mapAxes, filtres, sorting);

  const chantiersAvecAlertes = filtresAlertes.estEnAlerteÉcart || filtresAlertes.estEnAlerteBaisse || filtresAlertes.estEnAlerteTauxAvancementNonCalculé || filtresAlertes.estEnAlerteMétéoNonRenseignée || filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental ? chantiers.filter(chantier => {
    const chantierDonnéesTerritoires = chantier.mailles[mailleChantier][territoireCode];
    return (filtresAlertes.estEnAlerteÉcart && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
      || (filtresAlertes.estEnAlerteBaisse && Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance))
      || (filtresAlertes.estEnAlerteTauxAvancementNonCalculé && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global, chantier.cibleAttendu))
      || (filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental && Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(chantier.mailles.departementale, chantier.cibleAttendu))
      || (filtresAlertes.estEnAlerteMétéoNonRenseignée && Alerte.estEnAlerteMétéoNonRenseignée(chantierDonnéesTerritoires.météo));
  }) : chantiers;

  const récupérerStatistiquesChantiersUseCase = new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository());

  const listeAvancementsStatistiques = await Promise.all(
    chantiersAvecAlertes.map(chantier => récupérerStatistiquesChantiersUseCase.run([chantier.id], mailleSelectionnee || 'departementale', session.habilitations).then(avancementsStatistique => {
      const avancementChantierRapportDetaille = new AgrégateurChantierRapportDetailleParTerritoire(chantier).agréger();
      const avancementRégional = (typeTauxAvancement: 'global' | 'annuel') => {
        return territoireSélectionné.maille === 'regionale'
          ? avancementChantierRapportDetaille.regionale.territoires[territoireCode].répartition.avancements[typeTauxAvancement]
          : territoireSélectionné.maille === 'departementale' && territoireSélectionné.codeParent
            ? avancementChantierRapportDetaille.regionale.territoires[territoireSélectionné.codeParent].répartition.avancements[typeTauxAvancement]
            : null;
      };

      const avancementDépartemental = (typeTauxAvancement: 'global' | 'annuel') => {
        return territoireSélectionné.maille === 'departementale' ? avancementChantierRapportDetaille[mailleSelectionnee].territoires[territoireCode].répartition.avancements[typeTauxAvancement] : null;
      };

      return {
        id: chantier.id, avancementChantierRapportDetaille: {
          nationale: {
            global: {
              moyenne: avancementChantierRapportDetaille.nationale.répartition.avancements.global.moyenne,
              médiane: avancementsStatistique?.global.médiane ?? null,
              minimum: avancementsStatistique?.global.minimum ?? null,
              maximum: avancementsStatistique?.global.maximum ?? null,
            },
            annuel: {
              moyenne: avancementChantierRapportDetaille.nationale.répartition.avancements.annuel.moyenne,
            },
          },
          departementale: {
            global: {
              moyenne: avancementDépartemental('global'),
            },
            annuel: {
              moyenne: avancementDépartemental('annuel'),
            },
          },
          regionale: {
            global: {
              moyenne: avancementRégional('global'),
            },
            annuel: {
              moyenne: avancementRégional('annuel'),
            },
          },
        },
      };
    })),
  );

  const chantiersIds = chantiers.map(chantier => chantier.id);

  const indicateursRepository = dependencies.getIndicateurRepository();
  const indicateursGroupésParChantier = await indicateursRepository.récupérerGroupésParChantier(chantiersIds);
  const détailsIndicateursGroupésParChantier = await indicateursRepository.récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds, mailleChantier, codeInseeSelectionne);

  const synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository();
  const synthèsesDesRésultatsGroupéesParChantier = await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(chantiersIds, mailleChantier, codeInseeSelectionne);

  let décisionStratégiquesGroupéesParChantier: Record<string, DécisionStratégique | null> = Object.fromEntries(chantiersIds.map(id => [id, null]));
  if (habilitation.peutAccéderAuTerritoire('NAT-FR')) {
    const décisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository();
    décisionStratégiquesGroupéesParChantier = await décisionStratégiqueRepository.récupérerLesPlusRécentesGroupéesParChantier(chantiersIds);
  }

  const commentairesGroupésParChantier = await new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getCommentaireRepository()).run(chantiersIds, territoireCode, session.habilitations);

  const objectifsGroupésParChantier = await new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(dependencies.getObjectifRepository()).run(chantiersIds, session.habilitations);

  const {
    répartitionMétéos,
    filtresComptesCalculés,
  } = Chantier.recupererStatistiqueListeChantier(chantiers, mailleChantier, territoireCode);

  const avancementsAgrégés = await récupérerStatistiquesChantiersUseCase.run(chantiersAvecAlertes.map(chantier => chantier.id), mailleSelectionnee || 'departementale', session.habilitations).then(presenterEnAvancementsStatistiquesAccueilContrat);

  const donnéesTerritoiresAgrégées = new AgrégateurListeChantiersParTerritoire(chantiersAvecAlertes).agréger();

  if (avancementsAgrégés) {
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[territoireCode].répartition.avancements.global.moyenne;
    avancementsAgrégés.annuel.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[territoireCode].répartition.avancements.annuel.moyenne;
  }

  const avancementsGlobauxTerritoriauxMoyens = objectEntries(donnéesTerritoiresAgrégées[mailleSelectionnee || 'departementale'].territoires).map(([territoireCodeSelectionne, territoire]) => ({
    valeur: territoire.répartition.avancements.global.moyenne,
    valeurAnnuelle: territoire.répartition.avancements.annuel.moyenne,
    territoireCode: territoireCodeSelectionne,
    estApplicable: null,
  }));

  const listeDonnéesCartographieAvancement = chantiersAvecAlertes.map(chantier => ({
    id: chantier.id,
    donnéesCartographieAvancement: objectEntries(chantier.mailles[mailleSelectionnee]).map(([territoireCodeDonnee, territoire]) => ({
      valeur: territoire.avancement.global,
      valeurAnnuelle: territoire.avancement.annuel,
      territoireCode: territoireCodeDonnee,
      estApplicable: territoire.estApplicable,
    })),
  }));

  const listeDonnéesCartographieMétéo = chantiersAvecAlertes.map(chantier => ({
    id: chantier.id,
    donnéesCartographieMétéo: objectEntries(chantier.mailles[mailleSelectionnee]).map(([territoireCodeDonnee, territoire]) => ({
      valeur: territoire.météo,
      territoireCode: territoireCodeDonnee,
      estApplicable: territoire.estApplicable,
    })),
  }));

  const estAutoriseAVoirLesBrouillons = PROFILS_AUTORISE_VOIR_BROUILLONS.has(session.profil);

  return {
    props: {
      chantiers: chantiersAvecAlertes.map(chantier => {
        // @ts-expect-error
        delete chantier.mailles;
        return chantier;
      }),
      ministères,
      axes,
      indicateursGroupésParChantier,
      détailsIndicateursGroupésParChantier,
      mailleQuery,
      mailleSelectionnee,
      listeAvancementsStatistiques,
      listeDonnéesCartographieAvancement,
      listeDonnéesCartographieMétéo,
      filtresComptesCalculés,
      avancementsAgrégés,
      territoireCode,
      avancementsGlobauxTerritoriauxMoyens,
      répartitionMétéos,
      estAutoriseAVoirLesBrouillons,
      publicationsGroupéesParChantier: {
        commentaires: commentairesGroupésParChantier,
        synthèsesDesRésultats: synthèsesDesRésultatsGroupéesParChantier,
        objectifs: objectifsGroupésParChantier,
        décisionStratégique: décisionStratégiquesGroupéesParChantier,
      },
    },
  };
};

const NextPageRapportDétaillé: FunctionComponent<NextPageRapportDétailléProps> = ({
  chantiers,
  ministères,
  axes,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  mailleQuery,
  mailleSelectionnee,
  listeAvancementsStatistiques,
  filtresComptesCalculés,
  territoireCode,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  estAutoriseAVoirLesBrouillons,
  répartitionMétéos,
  listeDonnéesCartographieAvancement,
  listeDonnéesCartographieMétéo,
}) => {
  const mapChantierStatistiques = new Map<string, AvancementChantierRapportDetaille>();
  listeAvancementsStatistiques.forEach(itemAvancementsStatistique => {
    mapChantierStatistiques.set(itemAvancementsStatistique.id, itemAvancementsStatistique.avancementChantierRapportDetaille);
  });
  const mapDonnéesCartographieAvancement = new Map<string, AvancementsGlobauxTerritoriauxMoyensContrat>();
  listeDonnéesCartographieAvancement.forEach(itemDonnéesCartographieAvancement => {
    mapDonnéesCartographieAvancement.set(itemDonnéesCartographieAvancement.id, itemDonnéesCartographieAvancement.donnéesCartographieAvancement);
  });
  const mapDonnéesCartographieMétéo = new Map<string, CartographieDonnéesMétéo>();
  listeDonnéesCartographieMétéo.forEach(itemDonnéesCartographieMétéo => {
    mapDonnéesCartographieMétéo.set(itemDonnéesCartographieMétéo.id, itemDonnéesCartographieMétéo.donnéesCartographieMétéo);
  });

  return (
    <>
      <Head>
        <title>
          Rapport détaillé - PILOTE
        </title>
      </Head>
      <PageRapportDétaillé
        avancementsAgrégés={avancementsAgrégés}
        avancementsGlobauxTerritoriauxMoyens={avancementsGlobauxTerritoriauxMoyens}
        axes={axes}
        chantiers={chantiers}
        détailsIndicateursGroupésParChantier={détailsIndicateursGroupésParChantier}
        estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
        filtresComptesCalculés={filtresComptesCalculés}
        indicateursGroupésParChantier={indicateursGroupésParChantier}
        mailleQuery={mailleQuery}
        mailleSelectionnee={mailleSelectionnee}
        mapChantierStatistiques={mapChantierStatistiques}
        mapDonnéesCartographieAvancement={mapDonnéesCartographieAvancement}
        mapDonnéesCartographieMétéo={mapDonnéesCartographieMétéo}
        ministères={ministères}
        publicationsGroupéesParChantier={publicationsGroupéesParChantier}
        répartitionMétéos={répartitionMétéos}
        territoireCode={territoireCode}
      />
    </>
  );
};

export default NextPageRapportDétaillé;
