import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';

export default interface TableauChantiersProps {
  données: DonnéesTableauChantiers[],
  setNombreChantiersDansLeTableau?: (nombre: number) => void,
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
