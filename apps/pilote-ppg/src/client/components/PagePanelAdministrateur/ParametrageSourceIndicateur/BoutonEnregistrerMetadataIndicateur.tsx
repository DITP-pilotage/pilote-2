import { useEnregistrerMetadataIndicateur } from "./useEnregistrerMetadataIndicateur";
import { Button } from "@/components/shared/Button";
import { useFormParametrageSource } from "./form";

export const BoutonEnregistrerMetadataIndicateur = () => {
  const enregistrerMetadataIndicateur = useEnregistrerMetadataIndicateur();
  const form = useFormParametrageSource();

  return (
    <Button
      variant="primary"
      onClick={form.handleSubmit(enregistrerMetadataIndicateur)}
      type="button"
    >
      Sauvegarder
    </Button>
  );
};
