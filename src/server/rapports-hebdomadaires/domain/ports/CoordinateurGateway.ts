import {
  Coordinateur,
  ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";

export interface CoordinateurGateway {
  recupererCoordinateurs(params: {
    profils: ProfilCoordinateur[];
  }): Promise<Coordinateur[]>;
}
