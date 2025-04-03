import { ChantierVueDEnsemble } from '@/server/chantiers/domain/Chantier.interface';

export default interface RapportDétailléTableauChantiersProps {
  données: DonnéesTableauChantiers[],
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
