import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth';
import { FunctionComponent } from 'react';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import PageProjetStructurant from '@/components/PageProjetStructurant/PageProjetStructurant';
import RécupérerProjetStructurantUseCase from '@/server/usecase/projetStructurant/RécupérerProjetStructurantUseCase';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';

interface NextPageProjetStructurantProps {
  projetStructurant: ProjetStructurant,
  indicateurs: Indicateur[],
  détailsIndicateurs: DétailsIndicateurs
}

const NextPageProjetStructurant: FunctionComponent<NextPageProjetStructurantProps> = ({ projetStructurant, indicateurs, détailsIndicateurs }) => {
  return (
    <>
      <Head>
        <title>
          {`Projet structurant - ${projetStructurant.nom} - PILOTE`}
        </title>
      </Head>
      <PageProjetStructurant
        détailsIndicateurs={détailsIndicateurs}
        indicateurs={indicateurs}
        projetStructurant={projetStructurant}
      />
    </>
  );
};
export default NextPageProjetStructurant;

export async function getServerSideProps({ req, res, params }: GetServerSidePropsContext<{ id: ProjetStructurant['id'] }>) {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };
  
  const projetStructurant: ProjetStructurant = await new RécupérerProjetStructurantUseCase(
    dependencies.getProjetStructurantRepository(),
    dependencies.getTerritoireRepository(),
    dependencies.getMinistèreRepository(),
    dependencies.getSynthèseDesRésultatsProjetStructurantRepository(),
  ).run(params.id, session.habilitations);
  const indicateurRepository = dependencies.getIndicateurProjetStructurantRepository();
  const { indicateurs, détails } = await indicateurRepository.récupérerParProjetStructurant(projetStructurant.id, projetStructurant.territoire.codeInsee);

  return {
    props: {
      projetStructurant,
      indicateurs,
      détailsIndicateurs: détails,
    },
  };
}
