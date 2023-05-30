import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import PageProjetStructurant from '@/components/PageProjetStructurant/PageProjetStructurant';
import RécupérerProjetStructurantUseCase from '@/server/usecase/projetStructurant/RécupérerProjetStructurantUseCase';

interface NextPageProjetStructurantProps {
  projetStructurant: ProjetStructurant,
}

export default function NextPageProjetStructurant({ projetStructurant }: NextPageProjetStructurantProps) {
  return (
    <>
      <Head>
        <title>
          {`Projet structurant ${projetStructurant.id.replace('PS-', '')} - ${projetStructurant.nom} - PILOTE`}
        </title>
      </Head>
      <PageProjetStructurant projetStructurant={projetStructurant} />
    </>
  );
}

export async function getServerSideProps({ params }: GetServerSidePropsContext<{ id: ProjetStructurant['id'] }>) {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }
  
  const projetStructurant: ProjetStructurant = await new RécupérerProjetStructurantUseCase().run(params.id);

  return {
    props: {
      projetStructurant,
    },
  };
}
