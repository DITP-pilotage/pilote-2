import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { PageMessageInformation } from '@/components/PageAdminGestionContenus/PageMessageInformation';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { estAutoriséAModifierDesIndicateurs } from '@/client/utils/indicateur/indicateur';
import {
  MessageInformationContrat,
  presenterEnMessageInformationContrat,
} from '@/server/app/contrats/MessageInformationContrat';
import { RécupérerMessageInformationUseCase } from '@/server/gestion-contenu/usecases/RécupérerMessageInformationUseCase';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default function NextAdminMessageInformation({ messageInformation, modificationReussie }: { messageInformation: MessageInformationContrat, modificationReussie: boolean }) {
  return (
    <>
      <Head>
        <title>
          Message d'information - Pilote
        </title>
      </Head>
      <PageMessageInformation
        messageInformation={messageInformation}
        modificationReussie={modificationReussie}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !estAutoriséAModifierDesIndicateurs(session.profil)) {
    throw new Error('Not connected or not authorized ?');
  }

  const messageInformation = presenterEnMessageInformationContrat(await new RécupérerMessageInformationUseCase({ gestionContenuRepository: dependencies.getGestionContenuRepository() }).run());

  const modificationReussie = query._action === 'modification-reussie';

  return {
    props: {
      messageInformation,
      modificationReussie,
    },
  };
}
