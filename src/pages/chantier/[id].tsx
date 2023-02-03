import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantier from '@/components/PageChantier/PageChantier';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';

interface NextPageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  synthèseDesRésultats: SynthèseDesRésultats
}

export default function NextPageChantier({ chantier, indicateurs, synthèseDesRésultats }: NextPageChantierProps) {
  return (
    <PageChantier 
      chantier={chantier} 
      indicateurs={indicateurs}
      synthèseDesRésultats={synthèseDesRésultats}
    />
  );
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'] } }) {
  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs: Indicateur[] = await indicateurRepository.getByChantierId(params.id);

  const synthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository();
  const synthèseDesRésultats: SynthèseDesRésultats | null = await synthèseDesRésultatsRepository.findNewestByChantierId(params.id);

  return {
    props: {
      chantier,
      indicateurs,
      synthèseDesRésultats,
    },
  };
}
