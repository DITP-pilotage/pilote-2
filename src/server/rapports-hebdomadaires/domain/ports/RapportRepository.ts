import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import { StatutEnvoi } from "@/server/rapports-hebdomadaires/domain/StatutEnvoi";

export interface RapportRepository {
  sauvegarder(params: {
    rapport: RapportHebdomadaire;
  }): Promise<RapportHebdomadaire>;

  mettreAJour(params: {
    rapport: RapportHebdomadaire;
  }): Promise<RapportHebdomadaire>;

  recupererRapportsParStatut(params: {
    statut: StatutEnvoi;
    dateCreationMin?: Date;
  }): Promise<RapportHebdomadaire[]>;
}
