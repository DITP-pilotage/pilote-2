import { PrismaClient } from '@prisma/client';
import { ChantierSQLRepository } from '@/server/infrastructure/chantierSQLRepository';
import ChantierFront from '@/client/interfaces/ChantierFront.interface';
import PageChantier from '@/components/Chantier/PageChantier/PageChantier';

interface NextPageChantierProps {
  chantier: ChantierFront
}

export default function NextPageChantier({ chantier }: NextPageChantierProps) {
  return (
    <PageChantier chantier={chantier} />
  );
}

export async function getStaticPaths() {
  const prisma = new PrismaClient();
  const chantierRepository = new ChantierSQLRepository(prisma);

  const paths = chantierRepository.récupérerListeIdsCheminsTemp();

  return {
    paths,
    fallback: false,
  };
}
  
export async function getStaticProps({ params }) {
  const prisma = new PrismaClient();
  const chantierRepository = new ChantierSQLRepository(prisma);

  const chantier = chantierRepository.récupérerUnChantierTemps(params.id);
  console.log('chantier:', chantier);
  
  return {
    props: {
      chantier,
    },
  };
}
