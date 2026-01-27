import {
  Coordinateur,
  ProfilCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";

export interface CoordinateurGateway {
  recupererCoordinateurs(
    profils: ProfilCoordinateur[],
  ): Promise<Coordinateur[]>;
}
