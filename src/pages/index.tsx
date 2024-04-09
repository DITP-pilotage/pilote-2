import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { FunctionComponent } from 'react';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import PageAccueil from '@/components/PageAccueil/PageAccueil';
import { ProjetStructurantVueDEnsemble } from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import RécupérerListeProjetsStructurantsVueDEnsembleUseCase
  from '@/server/usecase/projetStructurant/RécupérerListeProjetsStructurantsVueDEnsembleUseCase';
import RécupérerChantiersAccessiblesEnLectureUseCase
  from '@/server/usecase/chantier/RécupérerChantiersAccessiblesEnLectureUseCase';
import { RécupérerVariableContenuUseCase } from '@/server/gestion-contenu/usecases/RécupérerVariableContenuUseCase';
import {
  ChantierAccueilContrat,
  presenterEnChantierAccueilContrat,
} from '@/server/chantiers/app/contrats/ChantierAccueilContrat';

interface NextPageAccueilProps {
  chantiers: ChantierAccueilContrat[]
  projetsStructurants: ProjetStructurantVueDEnsemble[]
  ministères: Ministère[]
  axes: Axe[],
  estProjetStructurantDisponible: boolean,
}

export const getServerSideProps: GetServerSideProps<NextPageAccueilProps>  = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations) {
    return {
      props: {
        chantiers: [],
        projetsStructurants: [],
        ministères: [],
        axes: [],
        estProjetStructurantDisponible: false,
      },
    };
  }

  const chantiers = await new RécupérerChantiersAccessiblesEnLectureUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDatesDeMàjRepository(),
    dependencies.getMinistèreRepository(),
    dependencies.getTerritoireRepository(),
  )
    .run(session.habilitations, session.profil)
    .then(chantiersResult => chantiersResult.map(presenterEnChantierAccueilContrat));

  const projetsStructurants: ProjetStructurantVueDEnsemble[] = await new RécupérerListeProjetsStructurantsVueDEnsembleUseCase(
    dependencies.getProjetStructurantRepository(),
    dependencies.getTerritoireRepository(),
    dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ).run(session.habilitations, session.profil);

  const chantierIds = chantiers.map(chantier => chantier.id);

  const [ministères, axes] = await Promise.all(
    [
      dependencies.getMinistèreRepository().getListePourChantiers(chantierIds),
      dependencies.getAxeRepository().getListePourChantiers(chantierIds),
    ],
  );

  const estProjetStructurantDisponible = new RécupérerVariableContenuUseCase().run({ nomVariableContenu: 'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS' });

  return {
    props: {
      chantiers,
      projetsStructurants,
      ministères,
      axes,
      estProjetStructurantDisponible: !!estProjetStructurantDisponible,
    },
  };
};

const NextPageAccueil : FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ chantiers, projetsStructurants, ministères, axes, estProjetStructurantDisponible }) => {
  return (
    <>
      <Head>
        <title>
          PILOTE - Piloter l’action publique par les résultats
        </title>
      </Head>
      <PageAccueil
        axes={axes}
        chantiers={chantiers}
        estProjetStructurantDisponible={estProjetStructurantDisponible}
        ministères={ministères}
        projetsStructurants={projetsStructurants}
      />
    </>
  );
};

export default NextPageAccueil;
