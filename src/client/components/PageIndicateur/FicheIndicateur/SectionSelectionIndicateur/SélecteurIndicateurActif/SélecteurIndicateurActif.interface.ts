import { UseFormSetValue } from "react-hook-form";

export default interface SélecteurIndicateurActif {
  etatIndicateurSélectionné: string;
  setEtatIndicateurSélectionné: UseFormSetValue<{
    indicHiddenPilote: string;
  }>;
  estEnCoursDeModification: boolean;
}
