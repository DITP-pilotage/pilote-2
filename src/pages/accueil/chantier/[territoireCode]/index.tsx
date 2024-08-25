import { FunctionComponent, useState } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import assert from 'node:assert/strict';
import PageChantiers from '@/components/PageAccueil/PageChantiers/PageChantiers';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoiresNew/SélecteursMaillesEtTerritoires';
import Titre from '@/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/FiltresNew/Filtres';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import RécupérerChantiersAccessiblesEnLectureUseCase
  from '@/server/chantiers/usecases/RécupérerChantiersAccessiblesEnLectureUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import SélecteurTypeDeRéforme from '@/components/PageAccueil/SélecteurTypeDeRéformeNew/SélecteurTypeDeRéforme';
import CompteurFiltre from '@/client/utils/filtres/CompteurFiltre';
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
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';
import IndexStyled from './index.styled';

interface ChantierAccueil {
  chantiers: ChantierAccueilContrat[]
  ministères: Ministère[]
  axes: Axe[],
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale',
  filtresComptesCalculés: Record<string, { nombre: number }>
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat
  répartitionMétéos: RépartitionsMétéos
}

export const getServerSideProps: GetServerSideProps<ChantierAccueil> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est obligatoire pour afficher la page d\'accueil');
  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

  const territoireCode = query.territoireCode as string;

  const territoireDept = session.habilitations.lecture.territoires.find(territoire => territoire.startsWith('DEPT'));
  const territoireReg = session.habilitations.lecture.territoires.find(territoire => territoire.startsWith('REG'));

  if ((territoireCode === 'NAT-FR' && !session.habilitations.lecture.territoires.includes('NAT-FR')) || !session.habilitations.lecture.territoires.includes(territoireCode)) {
    return {
      redirect: {
        statusCode: 302,
        destination: `/accueil/chantier/${query.maille === 'départementale' ? territoireDept : query.maille === 'départementale' ? territoireReg : session.habilitations.lecture.territoires[0]}`,
      },
    };
  }

  const filtres = {
    perimetres: query.perimetres ? (query.perimetres as string).split(',').filter(Boolean) : [],
    axes: query.axes ? (query.axes as string).split(',').filter(Boolean) : [],
    statut: query.statut === 'BROUILLON_ET_PUBLIE' ? ['BROUILLON', 'PUBLIE'] : query.statut === 'BROUILLON' ? ['BROUILLON'] : ['PUBLIE'],
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

  const {
    maille: mailleTerritoireSelectionnee,
    codeInsee: codeInseeSelectionne,
  } = territoireCodeVersMailleCodeInsee(territoireCode);
  const mailleSelectionnee = query.maille as 'départementale' | 'régionale' ?? (mailleTerritoireSelectionnee === 'REG' ? 'régionale' : 'départementale');

  const mailleChantier = mailleTerritoireSelectionnee === 'NAT' ? 'nationale' : mailleSelectionnee;

  const [ministères, axes] = session.habilitations.lecture.chantiers.length === 0 ? [[], []] : (
    await Promise.all(
      [
        dependencies.getMinistèreRepository().getListePourChantiers(session.habilitations.lecture.chantiers),
        dependencies.getAxeRepository().getListePourChantiers(session.habilitations.lecture.chantiers),
      ],
    )
  );

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDateDeMàjMeteoRepository(),
    dependencies.getTerritoireRepository(),
  )
    .run(session.habilitations, session.profil, territoireCode, mailleSelectionnee === 'régionale' ? 'REG' : 'DEPT', mailleChantier || 'départementale', codeInseeSelectionne, ministères, axes, filtres);

  const compteurFiltre = new CompteurFiltre(chantiers);

  const filtresComptesCalculés = compteurFiltre.compter([{
    nomCritère: 'estEnAlerteÉcart',
    condition: (chantier) => Alerte.estEnAlerteÉcart(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.écart),
  }, {
    nomCritère: 'estEnAlerteBaisse',
    condition: (chantier) => Alerte.estEnAlerteBaisse(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.tendance),
  }, {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    condition: (chantier) => Alerte.estEnAlerteTauxAvancementNonCalculé(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.avancement.global, chantier.cibleAttendu),
  }, {
    nomCritère: 'estEnAlerteAbscenceTauxAvancementDepartemental',
    condition: (chantier) => Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(chantier.mailles.départementale, chantier.cibleAttendu),
  },
  {
    nomCritère: 'estEnAlerteMétéoNonRenseignée',
    condition: (chantier) => Alerte.estEnAlerteMétéoNonRenseignée(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.météo),
  }]);

  const chantiersAvecAlertes = filtresAlertes.estEnAlerteÉcart || filtresAlertes.estEnAlerteBaisse || filtresAlertes.estEnAlerteTauxAvancementNonCalculé || filtresAlertes.estEnAlerteMétéoNonRenseignée || filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental ? chantiers.filter(chantier => {
    const chantierDonnéesTerritoires = chantier.mailles[mailleChantier][codeInseeSelectionne];
    return (filtresAlertes.estEnAlerteÉcart && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
      || (filtresAlertes.estEnAlerteBaisse && Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance))
      || (filtresAlertes.estEnAlerteTauxAvancementNonCalculé && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global, chantier.cibleAttendu))
      || (filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental && Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(chantier.mailles.départementale, chantier.cibleAttendu))
      || (filtresAlertes.estEnAlerteMétéoNonRenseignée && Alerte.estEnAlerteMétéoNonRenseignée(chantierDonnéesTerritoires.météo));
  }) : chantiers;

  const récupérerStatistiquesChantiersUseCase = new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository());
  const avancementsAgrégés = await récupérerStatistiquesChantiersUseCase.run(chantiersAvecAlertes.map(chantier => chantier.id), mailleSelectionnee || 'départementale', session.habilitations).then(presenterEnAvancementsStatistiquesAccueilContrat);

  const donnéesTerritoiresAgrégées = new AgrégateurListeChantiersParTerritoire(chantiersAvecAlertes, mailleSelectionnee || 'départementale').agréger();

  if (avancementsAgrégés) {
    avancementsAgrégés.global.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[codeInseeSelectionne].répartition.avancements.global.moyenne;
    avancementsAgrégés.annuel.moyenne = donnéesTerritoiresAgrégées[mailleChantier].territoires[codeInseeSelectionne].répartition.avancements.annuel.moyenne;
  }

  const avancementsGlobauxTerritoriauxMoyens = objectEntries(donnéesTerritoiresAgrégées[mailleSelectionnee || 'départementale'].territoires).map(([codeInsee, territoire]) => ({
    valeur: territoire.répartition.avancements.global.moyenne,
    codeInsee,
    estApplicable: null,
  }));

  const répartitionMétéos = chantiers.reduce((acc, chantier) => {
    const { météo } = chantier.mailles[mailleChantier][codeInseeSelectionne];

    return {
      ...acc,
      [météo]: acc[météo] + 1,
    };
  }, {
    ORAGE: 0,
    COUVERT: 0,
    NUAGE: 0,
    SOLEIL: 0,
    NON_RENSEIGNEE: 0,
    NON_NECESSAIRE: 0,
  } satisfies Record<MeteoDisponible | 'NON_RENSEIGNEE' | 'NON_NECESSAIRE', number>);

  return {
    props: {
      chantiers: chantiersAvecAlertes.map(chantier => {
        // @ts-expect-error
        delete chantier.mailles;
        return chantier;
      }),
      ministères,
      axes,
      territoireCode,
      mailleSelectionnee: mailleSelectionnee || 'départementale',
      filtresComptesCalculés,
      avancementsAgrégés,
      avancementsGlobauxTerritoriauxMoyens,
      répartitionMétéos,
    },
  };
};

const PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set([
  ProfilEnum.CABINET_MTFP,
  ProfilEnum.PM_ET_CABINET,
  ProfilEnum.PR,
  ProfilEnum.CABINET_MINISTERIEL,
  ProfilEnum.DIR_ADMIN_CENTRALE,
  ProfilEnum.DROM,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
]);

const ChantierLayout: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  chantiers,
  axes,
  ministères,
  territoireCode,
  mailleSelectionnee,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  répartitionMétéos,
}) => {
  const { data: session } = useSession();

  const estProfilTerritorialise = PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(session?.profil || '');
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('md');
  const [estVisibleEnMobile, setEstVisibleEnMobile] = useState(false);
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  return (
    <>
      <Head>
        <title>
          PILOTE - Piloter l’action publique par les résultats
        </title>
      </Head>
      <div className='flex'>
        <BarreLatérale
          estOuvert={estOuverteBarreLatérale}
          setEstOuvert={setEstOuverteBarreLatérale}
        >
          <BarreLatéraleEncart>
            <SélecteurTypeDeRéforme
              territoireCode={territoireCode}
              typeDeRéformeSélectionné='chantier'
            />
            <SélecteursMaillesEtTerritoires
              estVisibleEnMobile={estVisibleEnMobile}
              estVueMobile={estVueMobile}
              mailleSelectionnee={mailleSelectionnee}
              pathname='/accueil/chantier/[territoireCode]'
              territoireCode={territoireCode}
            />
          </BarreLatéraleEncart>
          <section>
            <Titre
              baliseHtml='h1'
              className='fr-h4 fr-mb-1w fr-px-3w fr-mt-3w fr-col-8'
            >
              Filtres
            </Titre>
            <Filtres
              afficherToutLesFiltres
              axes={axes}
              estProfilTerritorialise={estProfilTerritorialise}
              estVisibleEnMobile={estVisibleEnMobile}
              estVueMobile={estVueMobile}
              ministères={ministères}
            />
          </section>
        </BarreLatérale>
        <IndexStyled className='w-full'>
          <button
            className='fr-hidden-lg bouton-filtrer fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-equalizer-fill fr-text-title--blue-france fr-py-2w fr-px-5v'
            onClick={() => {
              setEstOuverteBarreLatérale(true);
              setEstVisibleEnMobile(true);
            }}
            title='Filtrer'
            type='button'
          >
            Filtrer
          </button>
          <PageChantiers
            avancementsAgrégés={avancementsAgrégés}
            avancementsGlobauxTerritoriauxMoyens={avancementsGlobauxTerritoriauxMoyens}
            axes={axes}
            chantiers={chantiers}
            filtresComptesCalculés={filtresComptesCalculés}
            mailleSelectionnee={mailleSelectionnee}
            ministères={ministères}
            répartitionMétéos={répartitionMétéos}
            territoireCode={territoireCode}
          />
        </IndexStyled>
      </div>
    </>
  );
};

export default ChantierLayout;
