import { useFormContext } from "react-hook-form";
import { MetadataIndicateurForm } from "@/components/PageIndicateur/usePageIndicateur";

export const useForm = () => {
  return useFormContext<MetadataIndicateurForm>();
};
