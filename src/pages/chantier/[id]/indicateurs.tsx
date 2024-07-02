import { GetServerSidePropsResult } from 'next';
import { GetServerSidePropsContext } from 'next/types';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierInformations } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import RécupérerChantierUseCase from '@/server/usecase/chantier/RécupérerChantierUseCase';
import { presenterEnRapportContrat, RapportContrat } from '@/server/app/contrats/RapportContrat';
import { estAutoriséAImporterDesIndicateurs } from '@/client/utils/indicateur/indicateur';
import {
  InformationIndicateurContrat,
  presenterEnInformationIndicateurContrat,
} from '@/server/app/contrats/InformationIndicateurContrat';

interface NextPageImportIndicateurProps {
  chantierInformations: ChantierInformations
  indicateurs: Indicateur[],
  rapport: RapportContrat | null,
  informationsIndicateur: InformationIndicateurContrat[],
}

type GetServerSideProps = GetServerSidePropsResult<NextPageImportIndicateurProps>;
type Params = {
  id: Chantier['id'],
  indicateurId: string,
  rapportId: string
};

export async function getServerSideProps({
  query,
  params,
  req,
  res,
}: GetServerSidePropsContext<Params>): Promise<GetServerSideProps> {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !estAutoriséAImporterDesIndicateurs(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const chantier: Chantier = await new RécupérerChantierUseCase(
    dependencies.getChantierRepository(),
    dependencies.getChantierDateDeMàjMeteoRepository(),
    dependencies.getMinistèreRepository(),
    dependencies.getTerritoireRepository(),
  ).run(params.id, session.habilitations, session.profil);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs = await indicateurRepository.récupérerParChantierId(params.id);

  let rapport: RapportContrat | null = null;

  if (query.rapportId) {
    rapport = presenterEnRapportContrat(await dependencies.getRapportRepository().récupérerRapportParId(query.rapportId as string));
  }

  const informationsIndicateur = await Promise.all<(InformationIndicateurContrat)>(
    indicateurs.map(indicateur => dependencies.getImportIndicateurRepository().recupererInformationIndicateurParId(indicateur.id).then(result => presenterEnInformationIndicateurContrat(result))),
  );

  return {
    props: {
      indicateurs,
      informationsIndicateur,
      rapport,
      chantierInformations: {
        id: chantier.id,
        nom: chantier.nom,
      },
    },
  };
}

export default function NextPageImportIndicateur({
  chantierInformations,
  indicateurs,
  informationsIndicateur,
  rapport,
}: NextPageImportIndicateurProps) {
  return (
    <>
      <Head>
        <title>
          {`Mettre à jour les données - Chantier ${chantierInformations.id.replace('CH-', '')} - PILOTE`}
        </title>
      </Head>
      <PageImportIndicateur
        chantierInformations={chantierInformations}
        indicateurs={indicateurs}
        informationsIndicateur={informationsIndicateur}
        rapport={rapport}
      />
    </>
  );
}
