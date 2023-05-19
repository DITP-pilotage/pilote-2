import Head from 'next/head';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import PageProjetStructurant from '@/components/PageProjetStructurant/PageProjetStructurant';
import ProjetStructurantBuilder from '@/server/domain/projetStructurant/ProjetStructurant.builder';

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

export async function getServerSideProps() {
  const projetStructurant: ProjetStructurant = await new ProjetStructurantBuilder().build();

  return {
    props: {
      projetStructurant,
    },
  };
}
