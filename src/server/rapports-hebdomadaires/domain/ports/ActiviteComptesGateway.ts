import { ActiviteComptes } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

export interface ActiviteComptesGateway {
  recupererActivite(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: string[];
  }): Promise<ActiviteComptes>;
}
