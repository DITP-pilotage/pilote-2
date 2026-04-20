import { useFormContext } from "react-hook-form";
import { UtilisateurFormInputs } from "@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire.interface";

export const useFormSaisieInformationUtilisateur = () =>
  useFormContext<UtilisateurFormInputs>();
