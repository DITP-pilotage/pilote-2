import { useFormContext } from "react-hook-form";
import { MetadataIndicateurForm } from "@/components/PageIndicateur/usePageIndicateur";

export const useMetadataIndicateurForm = () => {
  return useFormContext<MetadataIndicateurForm>();
};
