import { useEnregistrerMetadataIndicateur } from "./useEnregistrerMetadataIndicateur";
import { useFormParametrageSource } from "./form";

export const BoutonEnregistrerMetadataIndicateur = () => {
  const enregistrerMetadataIndicateur = useEnregistrerMetadataIndicateur();
  const form = useFormParametrageSource();

  return (
    <button
      className="fr-btn fr-btn--primary"
      onClick={form.handleSubmit(enregistrerMetadataIndicateur)}
      type="button"
    >
      Sauvegarder
    </button>
  );
};
