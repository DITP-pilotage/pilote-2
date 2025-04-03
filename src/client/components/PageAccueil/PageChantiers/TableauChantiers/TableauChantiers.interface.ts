import { ChantierVueDEnsemble } from '@/server/chantiers/domain/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';

export default interface TableauChantiersProps {
  nombreTotalChantiersAvecAlertes: number
  données: DonnéesTableauChantiers[]
  ministèresDisponibles: Ministère[]
  territoireCode: string
  jalon: number
  chantiersSontArchives: boolean
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
