import Axe from '@/server/domain/axe/Axe.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import ProjetStructurant, {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface PageAccueilProps {
  chantiers: Chantier[]
  projetsStructurants: ProjetStructurantVueDEnsemble[]
  ministères: Ministère[]
  axes: Axe[],
  ppgs: Ppg[],
}
