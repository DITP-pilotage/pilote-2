import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import PageProjetStructurant from '@/components/PageProjetStructurant/PageProjetStructurant';
import RécupérerProjetStructurantUseCase from '@/server/usecase/projetStructurant/RécupérerProjetStructurantUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

interface NextPageProjetStructurantProps {
  projetStructurant: ProjetStructurant,
  indicateurs: Indicateur[],
}

export default function NextPageProjetStructurant({ projetStructurant, indicateurs }: NextPageProjetStructurantProps) {
  return (
    <>
      <Head>
        <title>
          {`Projet structurant ${projetStructurant.id.replace('PS-', '')} - ${projetStructurant.nom} - PILOTE`}
        </title>
      </Head>
      <PageProjetStructurant
        indicateurs={indicateurs}
        projetStructurant={projetStructurant}
      />
    </>
  );
}

export async function getServerSideProps({ req, res, params }: GetServerSidePropsContext<{ id: ProjetStructurant['id'] }>) {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };
  
  const projetStructurant: ProjetStructurant = await new RécupérerProjetStructurantUseCase().run(params.id, session.habilitations);
  const indicateurRepository = dependencies.getIndicateurProjetStructurantRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.récupérerParProjetStructurant(projetStructurant.id, projetStructurant.territoire.codeInsee);

  return {
    props: {
      projetStructurant,
      indicateurs,
    },
  };
}
