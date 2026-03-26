import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

export type TauxAvancementComparaisonTerritoireViewModel = {
  territoireCode: string;
  maille: MailleTerritoireSelectionne;
  tauxAvancementJalon: number | null;
  // false = aucun chantier de la sélection n'est applicable
  // true  = tous les chantiers de la sélection sont applicables
  // null  = non renseigné / indéterminé
  estApplicable: boolean | null;
  dateTauxAvancementAnnuel: string | null;
};
