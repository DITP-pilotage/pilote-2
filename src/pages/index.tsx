import { PrismaClient } from '@prisma/client';
import ChantierSQLRepository from '@/server/infrastructure/ChantierSQLRepository';
import PérimètreMinistérielSQLRepository from '@/server/infrastructure/PérimètreMinistérielSQLRepository';
import PageChantiers from '@/client/components/Chantier/PageChantiers/PageChantiers';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRandomRepository from '@/server/infrastructure/PérimètreMinistérielRandomRepository';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import ChantierRandomRepository from '@/server/infrastructure/ChantierRandomRepository';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  périmètresMinistériels: PérimètreMinistériel[]
}

export default function NextPageAccueil({ chantiers, périmètresMinistériels }: NextPageAccueilProps) {
  return (
    <PageChantiers
      chantiers={chantiers}
      périmètresMinistériels={périmètresMinistériels}
    />
  );
}

export async function getServerSideProps() {
  let périmètreRepository: PérimètreMinistérielRepository;
  let chantierRepository: ChantierRepository;

  if (process.env.USE_DATABASE == 'true') {
    const prisma = new PrismaClient();
    périmètreRepository = new PérimètreMinistérielSQLRepository(prisma);
    chantierRepository = new ChantierSQLRepository(prisma);

  } else {
    const idPérimètres = [ { id: 'PER-001' }, { id: 'PER-002' }, { id: 'PER-003' }, { id: 'PER-004' } ];
    périmètreRepository = new PérimètreMinistérielRandomRepository(idPérimètres);
    chantierRepository = new ChantierRandomRepository(120, idPérimètres);
  }

  const périmètresMinistériels = await périmètreRepository.getListe();
  const chantiers = await chantierRepository.getListe();

  return {
    props: {
      chantiers,
      périmètresMinistériels,
    },
  };
}
