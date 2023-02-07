import { Avancement } from '@/server/domain/chantier/Chantier.interface';
import Météo from '@/server/domain/chantier/Météo.interface';

export type ChantierTerritorialisé = {
  id: string;
  nom: string;
  avancementGlobalTerritoire: Avancement['global'];
  météoTerritoire: Météo;
  estBaromètre: boolean
};
export default interface ListeChantiersProps {
  chantiersTerritorialisés: ChantierTerritorialisé[]
}
