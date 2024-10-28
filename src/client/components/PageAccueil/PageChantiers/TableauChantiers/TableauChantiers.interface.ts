import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default interface TableauChantiersProps {
  nombreTotalChantiersAvecAlertes: number,
  données: DonnéesTableauChantiers[],
  ministèresDisponibles: Ministère[],
  territoireCode: string
  mailleSelectionnee: MailleInterne
}

export type DonnéesTableauChantiers = ChantierVueDEnsemble;
