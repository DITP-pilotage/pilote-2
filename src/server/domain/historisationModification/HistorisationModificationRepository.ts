import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';
import {
  HistorisationModificationDisponible,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationDisponible';

export interface HistorisationModificationRepository {
  sauvegarderModificationHistorisation<K extends keyof HistorisationModificationDisponible>(historisationModification: HistorisationModification<K>): Promise<void>;
}
