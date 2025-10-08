import { Bouton } from "@/components/_commons/Bouton/Bouton";

export const BoutonEnregistrerBrouillon = ({ formId }: { formId: string }) => {
  return (
    <Bouton
      form={formId}
      label="Enregistrer le brouillon"
      type="submit"
      variant="secondary"
    />
  );
};
