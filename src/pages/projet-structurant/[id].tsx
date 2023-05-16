import Head from 'next/head';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import PageProjetStructurant from '@/components/PageProjetStructurant/PageProjetStructurant';

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
  const projetStructurant: ProjetStructurant = { 
    id: 'PS-001',
    nom: 'Projet structurant 1',
    tauxAvancement: 95,
    dateTauxAvancement: new Date().toISOString(),
    territoireNomÀAfficher: '78 - Yvelines',
    codeInsee: '78',
    maille: 'départementale',
    ministèresIds: ['MIN-001'],
    météo: 'SOLEIL',
  };

  return {
    props: {
      projetStructurant,
    },
  };
}
