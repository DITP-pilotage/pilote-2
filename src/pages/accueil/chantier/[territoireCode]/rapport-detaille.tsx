import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import assert from 'node:assert/strict';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import PageRapportDétaillé from '@/components/PageRapportDétailléNew/PageRapportDétaillé';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { PublicationsGroupéesParChantier } from '@/components/PageRapportDétailléNew/PageRapportDétaillé.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
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
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateurNew/agrégateur';
import { objectEntries } from '@/client/utils/objects/objects';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
import Axe from '@/server/domain/axe/Axe.interface';
import {
  AgrégateurChantierRapportDetailleParTerritoire,
} from '@/client/utils/chantier/agrégateurRapportDetailleNew/agrégateur';
import {
  AvancementChantierRapportDetaille,
} from '@/components/PageRapportDétailléNew/avancement-chantier-rapport-detaille';
import {
  CartographieDonnéesMétéo,
} from '@/components/_commons/Cartographie/CartographieMétéoNew/CartographieMétéo.interface';

interface NextPageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[]
  ministères: Ministère[]
  axes: Axe[]
  indicateursGroupésParChantier: Record<string, Indicateur[]>
  détailsIndicateursGroupésParChantier: Record<Chantier['id'], DétailsIndicateurs>
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier
  mailleSélectionnée: 'départementale' | 'régionale'
  listeAvancementsStatistiques: { id: string, avancementChantierRapportDetaille: AvancementChantierRapportDetaille }[]
  codeInsee: CodeInsee
  territoireCode: string
  filtresComptesCalculés: Record<string, { nombre: number }>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
  listeDonnéesCartographieAvancement: {
    id: string,
    donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat
  }[],
  listeDonnéesCartographieMétéo: {
    id: string,
    donnéesCartographieMétéo: CartographieDonnéesMétéo
  }[],
}

export const getServerSideProps: GetServerSideProps<NextPageRapportDétailléProps> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est manquant');
  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

  const filtres = {
    perimetres: query.perimetres ? (query.perimetres as string).split(',').filter(Boolean) : [],
    axes: query.axes ? (query.axes as string).split(',').filter(Boolean) : [],
    statut: query.brouillon === 'false' ? ['PUBLIE'] : ['BROUILLON', 'PUBLIE'],
    estTerritorialise: query.estTerritorialise === 'true',
    estBarometre: query.estBarometre === 'true',
  };

  const filtresAlertes = {
    estEnAlerteTauxAvancementNonCalculé: query.estEnAlerteTauxAvancementNonCalculé === 'true',
    estEnAlerteÉcart: query.estEnAlerteÉcart === 'true',
    estEnAlerteBaisse: query.estEnAlerteBaisse === 'true',
    estEnAlerteMétéoNonRenseignée: query.estEnAlerteMétéoNonRenseignée === 'true',
    estEnAlerteAbscenceTauxAvancementDepartemental: query.estEnAlerteAbscenceTauxAvancementDepartemental === 'true',
  };

  const territoireCode = query.territoireCode as string;
  const [maille, codeInseeSelectionne] = territoireCode.split('-');
  const mailleSelectionnee = query.maille as 'départementale' | 'régionale' ?? (maille === 'REG' ? 'régionale' : 'départementale');

  const mailleChantier = maille === 'NAT' ? 'nationale' : mailleSelectionnee;

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

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDateDeMàjMeteoRepository(),
    territoireRepository,
  )
    .run(session.habilitations, session.profil, territoireCode, mailleSelectionnee === 'régionale' ? 'REG' : 'DEPT', mailleChantier || 'départementale', codeInseeSelectionne, ministères, axes, filtres);


  const chantiersAvecAlertes = filtresAlertes.estEnAlerteÉcart || filtresAlertes.estEnAlerteBaisse || filtresAlertes.estEnAlerteTauxAvancementNonCalculé || filtresAlertes.estEnAlerteMétéoNonRenseignée || filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental ? chantiers.filter(chantier => {
    const chantierDonnéesTerritoires = chantier.mailles[mailleChantier][codeInseeSelectionne];
    return (filtresAlertes.estEnAlerteÉcart && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
      || (filtresAlertes.estEnAlerteBaisse && Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance))
      || (filtresAlertes.estEnAlerteTauxAvancementNonCalculé && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global))
      || (filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental && Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(chantier.mailles.départementale))
      || (filtresAlertes.estEnAlerteMétéoNonRenseignée && Alerte.estEnAlerteMétéoNonRenseignée(chantierDonnéesTerritoires.météo));
  }) : chantiers;

  const récupérerStatistiquesChantiersUseCase = new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository());

  const listeAvancementsStatistiques = await Promise.all(
    chantiersAvecAlertes.map(chantier => récupérerStatistiquesChantiersUseCase.run([chantier.id], mailleSelectionnee || 'départementale', session.habilitations).then(avancementsStatistique => {
      const avancementChantierRapportDetaille = new AgrégateurChantierRapportDetailleParTerritoire(chantier).agréger();
      const avancementRégional = (typeTauxAvancement: 'global' | 'annuel') => {
        return territoireSélectionné.maille === 'régionale'
          ? avancementChantierRapportDetaille.régionale.territoires[territoireSélectionné.codeInsee].répartition.avancements[typeTauxAvancement].moyenne
          : territoireSélectionné.maille === 'départementale' && territoireSélectionné.codeParent
            ? avancementChantierRapportDetaille.régionale.territoires[territoireSélectionné.codeParent.split('-')[1]].répartition.avancements[typeTauxAvancement].moyenne
            : null;
      };

      const avancementDépartemental = (typeTauxAvancement: 'global' | 'annuel') => {
        return territoireSélectionné.maille === 'départementale' ? avancementChantierRapportDetaille[mailleSelectionnee].territoires[territoireSélectionné.codeInsee].répartition.avancements[typeTauxAvancement].moyenne : null;
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
          départementale: {
            global: {
              moyenne: avancementDépartemental('global'),
            },
            annuel: {
              moyenne: avancementDépartemental('annuel'),
            },
          },
          régionale: {
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
  const indicateursGroupésParChantier = await indicateursRepository.récupérerGroupésParChantier(chantiersIds, mailleChantier, codeInseeSelectionne);
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

  // Vue Ensemble
  const compteurFiltre = new CompteurFiltre(chantiers);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'estEnAlerteÉcart',
    condition: (chantier) => Alerte.estEnAlerteÉcart(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.écart),
  }, {
    nomCritère: 'estEnAlerteBaisse',
    condition: (chantier) => Alerte.estEnAlerteBaisse(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.tendance),
  }, {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    condition: (chantier) => Alerte.estEnAlerteTauxAvancementNonCalculé(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.avancement.global),
  }, {
    nomCritère: 'estEnAlerteAbscenceTauxAvancementDepartemental',
    condition: (chantier) => Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(chantier.mailles.départementale),
  },
  {
    nomCritère: 'estEnAlerteMétéoNonRenseignée',
    condition: (chantier) => Alerte.estEnAlerteMétéoNonRenseignée(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.météo),
  },
  {
    nomCritère: 'orage',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'ORAGE'
    ) ?? false,
  }, {
    nomCritère: 'couvert',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'COUVERT'
    ) ?? false,
  }, {
    nomCritère: 'nuage',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'NUAGE'
    ) ?? false,
  }, {
    nomCritère: 'soleil',
    condition: (chantier) => (
      chantier.mailles[mailleChantier][codeInseeSelectionne].météo === 'SOLEIL'
    ) ?? false,
  }]);
  const avancementsAgrégés = await récupérerStatistiquesChantiersUseCase.run(chantiersAvecAlertes.map(chantier => chantier.id), mailleSelectionnee || 'départementale', session.habilitations).then(presenterEnAvancementsStatistiquesAccueilContrat);

  const donnéesTerritoiresAgrégées = new AgrégateurChantiersParTerritoire(chantiersAvecAlertes, mailleSelectionnee || 'départementale').agréger();

  if (avancementsAgrégés) {
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[codeInseeSelectionne].répartition.avancements.global.moyenne;
    avancementsAgrégés.annuel.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[codeInseeSelectionne].répartition.avancements.annuel.moyenne;
  }

  const avancementsGlobauxTerritoriauxMoyens = objectEntries(donnéesTerritoiresAgrégées[mailleSelectionnee || 'départementale'].territoires).map(([codeInsee, territoire]) => ({
    valeur: territoire.répartition.avancements.global.moyenne,
    codeInsee,
    estApplicable: null,
  }));

  const répartitionMétéos = {
    ORAGE: filtresComptesCalculés.orage.nombre,
    COUVERT: filtresComptesCalculés.couvert.nombre,
    NUAGE: filtresComptesCalculés.nuage.nombre,
    SOLEIL: filtresComptesCalculés.soleil.nombre,
  };
  // Fin Vue Ensemble

  const listeDonnéesCartographieAvancement = chantiersAvecAlertes.map(chantier => ({
    id: chantier.id,
    donnéesCartographieAvancement: objectEntries(chantier.mailles[mailleSelectionnee]).map(([codeInsee, territoire]) => ({
      valeur: territoire.avancement.global,
      codeInsee: codeInsee,
      estApplicable: territoire.estApplicable,
    })),
  }
  ));
  const listeDonnéesCartographieMétéo = chantiersAvecAlertes.map(chantier => ({
    id: chantier.id,
    donnéesCartographieMétéo: objectEntries(chantier.mailles[mailleSelectionnee]).map(([codeInsee, territoire]) => ({
      valeur: territoire.météo,
      codeInsee: codeInsee,
      estApplicable: territoire.estApplicable,
    })),
  }
  ));

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
      mailleSélectionnée: mailleSelectionnee,
      codeInsee: codeInseeSelectionne,
      listeAvancementsStatistiques,
      listeDonnéesCartographieAvancement,
      listeDonnéesCartographieMétéo,
      filtresComptesCalculés,
      avancementsAgrégés,
      territoireCode,
      avancementsGlobauxTerritoriauxMoyens,
      répartitionMétéos,
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
  axes,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  mailleSélectionnée,
  listeAvancementsStatistiques,
  codeInsee,
  filtresComptesCalculés,
  territoireCode,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  répartitionMétéos,
  listeDonnéesCartographieAvancement,
  listeDonnéesCartographieMétéo,
}: NextPageRapportDétailléProps) {
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
        codeInsee={codeInsee}
        détailsIndicateursGroupésParChantier={détailsIndicateursGroupésParChantier}
        filtresComptesCalculés={filtresComptesCalculés}
        indicateursGroupésParChantier={indicateursGroupésParChantier}
        mailleSélectionnée={mailleSélectionnée}
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
}
