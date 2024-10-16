import { FunctionComponent, useState } from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { useRouter } from 'next/router';
import assert from 'node:assert/strict';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import SélecteursMaillesEtTerritoires
  from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Titre from '@/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/Filtres/Filtres';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import SélecteurTypeDeRéforme from '@/components/PageAccueil/SélecteurTypeDeRéforme/SélecteurTypeDeRéforme';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import { ProjetStructurantVueDEnsemble } from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import RécupérerListeProjetsStructurantsVueDEnsembleUseCase
  from '@/server/usecase/projetStructurant/RécupérerListeProjetsStructurantsVueDEnsembleUseCase';
import PageProjetsStructurants from '@/components/PageAccueil/PageProjetsStructurants/PageProjetsStructurants';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import IndexStyled from './index.styled';

interface ChantierAccueil {
  projetsStructurants: ProjetStructurantVueDEnsemble[]
  ministères: Ministère[]
  axes: Axe[],
  estProjetStructurantDisponible: boolean,
}

export const getServerSideProps: GetServerSideProps<ChantierAccueil> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);

  assert(query.territoireCode, 'Le territoire code est obligatoire pour afficher la page d\'accueil');
  assert(session, 'Vous devez être authentifié pour accéder a cette page');
  assert(session.habilitations, 'La session ne dispose d\'aucune habilitation');

  const estNouvellePageAccueilDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL' });

  if (!estNouvellePageAccueilDisponible && session.profil !== ProfilEnum.DITP_ADMIN) {
    throw new Error('Not connected or not authorized ?');
  }

  const projetsStructurants: ProjetStructurantVueDEnsemble[] = await new RécupérerListeProjetsStructurantsVueDEnsembleUseCase(
    dependencies.getProjetStructurantRepository(),
    dependencies.getTerritoireRepository(),
    dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ).run(session.habilitations, session.profil);

  const [ministères, axes] = session.habilitations.lecture.chantiers.length === 0 ? [[], []] : (
    await Promise.all(
      [
        dependencies.getMinistèreRepository().getListePourChantiers(session.habilitations.lecture.chantiers),
        dependencies.getAxeRepository().getListePourChantiers(session.habilitations.lecture.chantiers),
      ],
    )
  );

  const estProjetStructurantDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS' });

  return {
    props: {
      projetsStructurants,
      ministères,
      axes,
      estProjetStructurantDisponible: !!estProjetStructurantDisponible,
    },
  };
};

const ChantierLayout: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  projetsStructurants,
  axes,
  ministères,
  estProjetStructurantDisponible,
}) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('md');
  const [estVisibleEnMobile, setEstVisibleEnMobile] = useState(false);
  const router = useRouter();

  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          {
            estProjetStructurantDisponible ? (
              <SélecteurTypeDeRéforme
                modifierTypeDeRéformeSélectionné={() => {
                  router.push('/');
                }}
                typeDeRéformeSélectionné='projet structurant'
              />
            ) : null
          }
          <SélecteursMaillesEtTerritoires
            estVisibleEnMobile={estVisibleEnMobile}
            estVueMobile={estVueMobile}
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
      <IndexStyled className='w-full'>
        <div className='bouton-filtrer fr-hidden-lg fr-py-1w fr-px-1v'>
          <button
            className='fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-equalizer-fill fr-text-title--blue-france'
            onClick={() => {
              setEstOuverteBarreLatérale(true);
              setEstVisibleEnMobile(true);
            }}
            title='Filtrer'
            type='button'
          >
            Filtrer
          </button>
        </div>
        <PageProjetsStructurants
          ministères={ministères}
          projetsStructurants={projetsStructurants}
        />
      </IndexStyled>
    </div>
  );
};

export default ChantierLayout;
