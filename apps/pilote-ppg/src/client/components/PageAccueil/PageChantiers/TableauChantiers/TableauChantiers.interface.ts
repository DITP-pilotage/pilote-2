import { ChantierVueDEnsemble } from "@/shared/chantier/Chantier.interface";
import { Ministère } from "@/shared/ministere/Ministere.interface";

export default interface TableauChantiersProps {
  nombreTotalChantiersAvecAlertes: number;
  données: DonnéesTableauChantiers[];
  ministèresDisponibles: Ministère[];
  territoireCode: string;
  jalon: number;
  chantiersSontArchives: boolean;
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
