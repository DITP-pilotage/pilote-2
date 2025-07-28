import { Chantier } from "@/server/fiche-territoriale/domain/Chantier";

export interface ChantierRepository {
  listerParTerritoireCodePourUnDepartement: ({
    territoireCode,
    jalon,
  }: {
    territoireCode: string;
    jalon: number;
  }) => Promise<Chantier[]>;
  listerParTerritoireCodePourUneRegion: ({
    territoireCode,
    jalon,
  }: {
    territoireCode: string;
    jalon: number;
  }) => Promise<Chantier[]>;
  listerParTerritoireCodePourEtMaille: ({
    territoireCode,
    maille,
    jalon,
  }: {
    territoireCode: string;
    maille: string;
    jalon: number;
  }) => Promise<Chantier[]>;
}
