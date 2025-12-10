import { useFormContext } from "react-hook-form";
import { ContenuForm } from "@/components/PageAdminGestionContenus/useMessageInformation";

export const useMessageInformationForm = () => {
  return useFormContext<ContenuForm>();
};
