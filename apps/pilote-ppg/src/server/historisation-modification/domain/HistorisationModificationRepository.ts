import { HistorisationModification } from "@/server/historisation-modification/domain/HistorisationModification";
import { HistorisationModificationDisponible } from "@/server/historisation-modification/infrastructure/HistorisationModificationDisponible";

export interface HistorisationModificationRepository {
  sauvegarderModificationHistorisation<
    K extends keyof HistorisationModificationDisponible,
  >(
    historisationModification: HistorisationModification<K>,
  ): Promise<void>;
  anonymiserAuteurs(
    listeIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void>;
}
