import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';

export default interface TableauChantiersProps {
  données: DonnéesTableauChantiers[],
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
