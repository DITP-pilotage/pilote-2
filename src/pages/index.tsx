import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Ministère } from '@/components/PageChantiers/BarreLatérale/FiltresMinistères/FiltresMinistères.interface';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  ministères: Ministère[]
}

export default function NextPageAccueil({ chantiers, ministères }: NextPageAccueilProps) {
  return (
    <PageChantiers
      chantiers={chantiers}
      ministères={ministères}
    />
  );
}

export async function getServerSideProps() {
  const périmètreRepository = dependencies.getPerimètreMinistérielRepository();
  const chantierRepository = dependencies.getChantierRepository();

  const périmètresMinistériels = await périmètreRepository.getListe();
  const chantiers = await chantierRepository.getListe();

  const ministères = [
    {
      nom: 'Agriculture et Alimentation',
      périmètresMinistériels: [
        { id: 'PER-001', nom: 'Agriculture' },
        { id: 'PER-002', nom: 'Alimentation' },
      ],
    },
    {
      nom: 'Cohésion des territoires et relations avec les collectivités territoriales',
      périmètresMinistériels: [
        { id: 'PER-003', nom: 'Cohésion des territoires, ville' },
        { id: 'PER-004', nom: 'Aménagement du territoire' },
        { id: 'PER-005', nom: 'Logement' },
      ],
    },
  ];
  
  return {
    props: {
      chantiers,
      ministères,
    },
  };
}
