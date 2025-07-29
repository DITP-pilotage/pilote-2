import { Chantier } from "@/server/fiche-conducteur/domain/Chantier";

export interface ChantierRepository {
  récupérerParIdEtParTerritoireCode({
    chantierId,
    territoireCode,
  }: {
    chantierId: string;
    territoireCode: string;
    jalon: number;
  }): Promise<Chantier>;
  récupérerMailleNatEtDeptParId(
    chantierId: string,
    jalon: number,
  ): Promise<Chantier[]>;
}
