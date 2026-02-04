import { $Enums } from "@prisma/client";
import { RapportPropositionsAvancement } from "@/server/chantiers/domain/RapportPropositionsAvancement";

export interface RapportPropositionsAvancementRepository {
  sauvegarder(rapport: RapportPropositionsAvancement): Promise<void>;
  recupererRapportsParStatut(
    statut: $Enums.statut_envoi_rapport,
  ): Promise<RapportPropositionsAvancement[]>;
}
