import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { FunctionComponent } from 'react';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import PageAdminGestionTokenAPI from '@/components/PageAdminGestionTokenAPI/PageAdminGestionTokenAPI';
import { TokenAPIInformationContrat } from '@/server/authentification/app/contrats/TokenAPIInformationContrat';
import { ListerTokenAPIInformationUseCase } from '@/server/authentification/usecases/ListerTokenAPIInformationUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';

const PROFIL_AUTORISE_A_MODIFIER = new Set(['DITP_ADMIN']);

export function estAutoriséAModifierLesTokensAPI(profil: string): boolean {
  return PROFIL_AUTORISE_A_MODIFIER.has(profil);
}

export const getServerSideProps: GetServerSideProps<{
  listeTokenAPIInformation: TokenAPIInformationContrat[],
  suppressionReussie: boolean
}> = async ({ req, res, query }) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !estAutoriséAModifierLesTokensAPI(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const listeTokenAPIInformation = await new ListerTokenAPIInformationUseCase({
    tokenAPIInformationRepository: dependencies.getTokenAPIInformationRepository(),
  }).run();

  const suppressionReussie = query._action === 'suppression-reussie';

  return {
    props: {
      listeTokenAPIInformation,
      suppressionReussie,
    },
  };
};

const NextAdminTokenApi: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  listeTokenAPIInformation,
  suppressionReussie,
}) => {
  return (
    <>
      <Head>
        <title>
          Gestion des tokens API - Pilote
        </title>
      </Head>
      <div>
        <PageAdminGestionTokenAPI
          listeTokenAPIInformation={listeTokenAPIInformation}
          suppressionReussie={suppressionReussie}
        />
      </div>
    </>
  );
};

export default NextAdminTokenApi;
