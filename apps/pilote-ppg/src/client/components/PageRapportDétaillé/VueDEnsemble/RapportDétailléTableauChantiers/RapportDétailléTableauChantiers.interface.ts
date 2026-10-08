import { ChantierVueDEnsemble } from "@/shared/chantier/Chantier.interface";

export default interface RapportDétailléTableauChantiersProps {
  données: DonnéesTableauChantiers[];
  chantiersSontArchives: boolean;
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
