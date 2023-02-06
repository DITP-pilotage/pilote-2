import Chantier from '@/server/domain/chantier/Chantier.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';

export default interface PageChantierProps {
  chantier: Chantier
  indicateurs: Indicateur[]
  synthèseDesRésultats: SynthèseDesRésultats
}
