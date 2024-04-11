import { FunctionComponent, useState } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import assert from 'node:assert/strict';
import PageChantiers from '@/components/PageAccueil/PageChantiersNew/PageChantiers';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoiresNew/SélecteursMaillesEtTerritoires';
import Titre from '@/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/Filtres/Filtres';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import RécupérerChantiersAccessiblesEnLectureUseCase
  from '@/server/chantiers/usecases/RécupérerChantiersAccessiblesEnLectureUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  ChantierAccueilContrat,
  MailleChantierContrat,
  presenterEnChantierAccueilContrat,
} from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import SélecteurTypeDeRéforme from '@/components/PageAccueil/SélecteurTypeDeRéformeNew/SélecteurTypeDeRéforme';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';

interface ChantierAccueilLayout {
  chantiers: ChantierAccueilContrat[]
  ministères: Ministère[]
  axes: Axe[],
  ppgs: Ppg[],
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale'
}

const masquerPourDROM = (sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return sessionProfil === 'DROM' && mailleChantier === 'nationale';
};
const appliquerFiltreDrom = (chantier: ChantierAccueilContrat, sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return masquerPourDROM(sessionProfil, mailleChantier) ? chantier.périmètreIds.includes('PER-018') : true;
};

const appliquerFiltreTerritorialise = (chantier: ChantierAccueilContrat, mailleChantier: MailleChantierContrat): boolean => {
  return mailleChantier !== 'nationale' ? chantier.estTerritorialisé || !!chantier.tauxAvancementDonnéeTerritorialisée[mailleChantier] || !!chantier.météoDonnéeTerritorialisée[mailleChantier] : true;
};

const appliquerFiltre = (mailleChantier: MailleChantierContrat, codeInsee: string, sessionProfil: string) => {

  return (chantier: ChantierAccueilContrat): boolean => {
    return !!chantier.mailles[mailleChantier][codeInsee].estApplicable
    && appliquerFiltreDrom(chantier, sessionProfil, mailleChantier)
    && appliquerFiltreTerritorialise(chantier, mailleChantier);
  };
};

export const getServerSideProps: GetServerSideProps<ChantierAccueilLayout>  = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est obligatoire pour afficher la page d\'accueil');
  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

  const estNouvellePageAccueilDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL' });

  if (!estNouvellePageAccueilDisponible && session.profil !== 'DITP_ADMIN') {
    throw new Error('Not connected or not authorized ?');
  }

  const territoireCode = query.territoireCode as string;
  const mailleSelectionnee = query.maille as 'départementale' | 'régionale';
  const [maille, codeInsee] = territoireCode.split('-');

  const mailleChantier = maille === 'NAT' ? 'nationale' : mailleSelectionnee ?? (maille === 'REG' ? 'régionale' : 'départementale');

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDatesDeMàjRepository(),
    dependencies.getMinistèreRepository(),
    dependencies.getTerritoireRepository(),
  )
    .run(session.habilitations, session.profil, mailleSelectionnee === 'régionale' ? 'REG' : 'DEPT')
    .then(chantiersResult => chantiersResult
      .map(presenterEnChantierAccueilContrat)
      .filter(appliquerFiltre(mailleChantier || 'départementale', codeInsee, session.profil)),
    );

  const chantierIds = chantiers.map(chantier => chantier.id);

  const [ministères, axes, ppgs] = await Promise.all(
    [
      dependencies.getMinistèreRepository().getListePourChantiers(chantierIds),
      dependencies.getAxeRepository().getListePourChantiers(chantierIds),
      dependencies.getPpgRepository().getListePourChantiers(chantierIds),
    ],
  );

  return {
    props: {
      chantiers,
      ministères,
      axes,
      ppgs,
      territoireCode,
      mailleSelectionnee: mailleSelectionnee || 'départementale',
    },
  };
};

const ChantierLayout: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ chantiers, axes, ministères, ppgs, territoireCode, mailleSelectionnee }) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  return (
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
            ppgs={ppgs}
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
          chantiers={chantiers}
          mailleSelectionnee={mailleSelectionnee}
          ministères={ministères}
          territoireCode={territoireCode}
        />
      </div>
    </div>
  );
};

export default ChantierLayout;
