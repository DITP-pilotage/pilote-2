import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import { $Enums } from "@prisma/client";

export interface RapportRepository {
  sauvegarder(params: {
    rapport: RapportHebdomadaire;
  }): Promise<RapportHebdomadaire>;

  mettreAJour(params: {
    rapport: RapportHebdomadaire;
  }): Promise<RapportHebdomadaire>;

  recupererRapportsParStatut(params: {
    statut: $Enums.statut_envoi_rapport;
    dateCreationMin?: Date;
  }): Promise<RapportHebdomadaire[]>;
}
