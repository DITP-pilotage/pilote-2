import {
  CartographieDonnéesAvancement,
} from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { RépartitionMétéos } from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéo.interface';
import { ChantierVueDEnsemble } from '@/components/useVueDEnsemble';

export default interface RapportDétailléVueDEnsembleProps {
  auClicTerritoireCallback: () => void,
  donnéesCartographie: CartographieDonnéesAvancement,
  avancements: AvancementsStatistiques,
  météos: RépartitionMétéos,
  donnéesTableauChantiers: ChantierVueDEnsemble[]
}
