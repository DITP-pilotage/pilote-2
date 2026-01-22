import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

export interface EnvoieEmailService {
  envoyerRapportHebdomadaire(params: {
    rapport: RapportHebdomadaire;
  }): Promise<void>;
}
