import { ChantierVueDEnsemble } from '@/components/useVueDEnsemble';

export default interface TableauChantiersProps {
  données: DonnéesTableauChantiers[],
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
