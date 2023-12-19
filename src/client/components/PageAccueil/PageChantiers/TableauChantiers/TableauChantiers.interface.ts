import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface TableauChantiersProps {
  données: DonnéesTableauChantiers[],
  ministèresDisponibles: Ministère[],
  setNombreChantiersDansLeTableau?: (nombre: number) => void,
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
