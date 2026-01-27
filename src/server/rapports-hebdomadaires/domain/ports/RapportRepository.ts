import { $Enums } from "@prisma/client";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

export interface RapportRepository {
  sauvegarder(rapport: RapportHebdomadaire): Promise<void>;

  recupererRapportsParStatut(
    statut: $Enums.statut_envoi_rapport,
    dateCreationMin?: Date,
  ): Promise<RapportHebdomadaire[]>;
}
