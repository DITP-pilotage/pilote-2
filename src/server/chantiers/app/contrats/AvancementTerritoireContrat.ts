import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

export type AvancementTerritoireViewModel = {
  territoireCode: string;
  territoireNom: string;
  codeInsee: string;
  maille: MailleTerritoireSelectionne;
  avancementAnnuel: number | null;
  estApplicable: boolean | null;
  dateTauxAvancementAnnuel: string | null;
};
