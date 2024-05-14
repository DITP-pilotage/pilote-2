import { FunctionComponent, useState } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import assert from 'node:assert/strict';
import PageChantiers from '@/components/PageAccueil/PageChantiersNew/PageChantiers';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoiresNew/SélecteursMaillesEtTerritoires';
import Titre from '@/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/FiltresNew/Filtres';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import RécupérerChantiersAccessiblesEnLectureUseCase
  from '@/server/chantiers/usecases/RécupérerChantiersAccessiblesEnLectureUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import SélecteurTypeDeRéforme from '@/components/PageAccueil/SélecteurTypeDeRéformeNew/SélecteurTypeDeRéforme';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
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
import { AgrégateurChantiersParTerritoire } from '@/client/utils/chantier/agrégateurNew/agrégateur';
import { objectEntries } from '@/client/utils/objects/objects';

interface ChantierAccueil {
  chantiers: ChantierAccueilContrat[]
  ministères: Ministère[]
  axes: Axe[],
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale',
  brouillon: boolean
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

  const territoireDept = session.habilitations.lecture.territoires.find(territoire => territoire.startsWith('DEPT'));
  const territoireReg = session.habilitations.lecture.territoires.find(territoire => territoire.startsWith('REG'));

  const estNouvellePageAccueilDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL' });

  if (!estNouvellePageAccueilDisponible && session.profil !== 'DITP_ADMIN') {
    throw new Error('Not connected or not authorized ?');
  }

  if ((query.territoireCode === 'NAT-FR' && !session.habilitations.lecture.territoires.includes('NAT-FR')) || !session.habilitations.lecture.territoires.includes(query.territoireCode as string)) {
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
    statut: query.brouillon === 'false' ? ['PUBLIE'] : ['BROUILLON', 'PUBLIE'],
    estTerritorialise: query.estTerritorialise === 'true',
    estBarometre: query.estBarometre === 'true',
  };

  const filtresAlertes = {
    estEnAlerteTauxAvancementNonCalculé: query.estEnAlerteTauxAvancementNonCalculé === 'true',
    estEnAlerteÉcart: query.estEnAlerteÉcart === 'true',
    estEnAlerteBaisse: query.estEnAlerteBaisse === 'true',
    estEnAlerteDonnéesNonMàj: query.estEnAlerteDonnéesNonMàj === 'true',
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

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDatesDeMàjRepository(),
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
    nomCritère: 'estEnAlerteDonnéesNonMàj',
    condition: (chantier) => Alerte.estEnAlerteDonnéesNonMàj(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.dateDeMàjDonnéesQualitatives, chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.dateDeMàjDonnéesQuantitatives),
  }, {
    nomCritère: 'estEnAlerteTauxAvancementNonCalculé',
    condition: (chantier) => Alerte.estEnAlerteTauxAvancementNonCalculé(chantier.mailles[mailleChantier]?.[codeInseeSelectionne]?.avancement.global),
  }, {
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

  const chantiersAvecAlertes = filtresAlertes.estEnAlerteÉcart || filtresAlertes.estEnAlerteBaisse || filtresAlertes.estEnAlerteDonnéesNonMàj || filtresAlertes.estEnAlerteTauxAvancementNonCalculé ? chantiers.filter(chantier => {
    const chantierDonnéesTerritoires = chantier.mailles[mailleChantier][codeInseeSelectionne];
    return (filtresAlertes.estEnAlerteÉcart && Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart))
      || (filtresAlertes.estEnAlerteBaisse && Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance))
      || (filtresAlertes.estEnAlerteDonnéesNonMàj && Alerte.estEnAlerteDonnéesNonMàj(chantierDonnéesTerritoires.dateDeMàjDonnéesQualitatives, chantierDonnéesTerritoires.dateDeMàjDonnéesQuantitatives))
      || (filtresAlertes.estEnAlerteTauxAvancementNonCalculé && Alerte.estEnAlerteTauxAvancementNonCalculé(chantierDonnéesTerritoires.avancement.global));
  }) : chantiers;

  const récupérerStatistiquesChantiersUseCase = new RécupérerStatistiquesAvancementChantiersUseCase(dependencies.getChantierRepository());
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

  return {
    props: {
      chantiers: chantiersAvecAlertes.map(chantier => {
        // @ts-ignore
        delete chantier.mailles;
        return chantier;
      }),
      ministères,
      axes,
      territoireCode,
      mailleSelectionnee: mailleSelectionnee || 'départementale',
      brouillon: query.brouillon !== 'false',
      filtresComptesCalculés,
      avancementsAgrégés,
      avancementsGlobauxTerritoriauxMoyens,
      répartitionMétéos,
    },
  };
};

const ChantierLayout: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  chantiers,
  axes,
  ministères,
  territoireCode,
  mailleSelectionnee,
  brouillon,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  répartitionMétéos,
}) => {
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
              mailleSelectionnee={mailleSelectionnee}
              territoireCode={territoireCode}
            />
          </BarreLatéraleEncart>
          <section>
            <Titre
              baliseHtml='h1'
              className='fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8'
            >
              Filtres
            </Titre>
            <Filtres
              afficherToutLesFiltres
              axes={axes}
              ministères={ministères}
            />
          </section>
        </BarreLatérale>
        <div className='w-full'>
          <BoutonSousLigné
            classNameSupplémentaires='fr-link--icon-left fr-fi-arrow-right-line fr-hidden-lg fr-m-2w'
            onClick={() => setEstOuverteBarreLatérale(true)}
            type='button'
          >
            Filtres
          </BoutonSousLigné>
          <PageChantiers
            avancementsAgrégés={avancementsAgrégés}
            avancementsGlobauxTerritoriauxMoyens={avancementsGlobauxTerritoriauxMoyens}
            axes={axes}
            brouillon={brouillon}
            chantiers={chantiers}
            filtresComptesCalculés={filtresComptesCalculés}
            mailleSelectionnee={mailleSelectionnee}
            ministères={ministères}
            répartitionMétéos={répartitionMétéos}
            territoireCode={territoireCode}
          />
        </div>
      </div>
    </>
  );
};

export default ChantierLayout;
