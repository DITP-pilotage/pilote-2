import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';

export default interface RapportDétailléTableauChantiersProps {
  données: DonnéesTableauChantiers[],
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
