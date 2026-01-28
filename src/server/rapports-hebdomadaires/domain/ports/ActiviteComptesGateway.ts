import { ActiviteComptes } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

export type ProfilTerritorialise =
  | "COORDINATEUR_REGION"
  | "COORDINATEUR_DEPARTEMENT"
  | "PREFET_DEPARTEMENT"
  | "PREFET_REGION"
  | "SERVICES_DECONCENTRES_DEPARTEMENT"
  | "SERVICES_DECONCENTRES_REGION";

export interface ActiviteComptesGateway {
  recupererActivite(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: ProfilTerritorialise[];
  }): Promise<ActiviteComptes>;
}
