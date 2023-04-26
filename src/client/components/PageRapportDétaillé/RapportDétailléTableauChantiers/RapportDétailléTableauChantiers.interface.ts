import { ChantierVueDEnsemble } from '@/components/useVueDEnsemble';

export default interface RapportDétailléTableauChantiersProps {
  données: DonnéesTableauChantiers[],
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
