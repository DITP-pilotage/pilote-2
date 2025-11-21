import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { SaveIcon } from "@/client/components/_commons/Icones/SaveIcon";

export const BoutonEnregistrerBrouillon = ({ formId }: { formId: string }) => {
  return (
    <Bouton
      className="!mt-2"
      form={formId}
      iconLeft={<SaveIcon className="h-4 w-4 mt-1" />}
      label="Enregistrer le brouillon"
      type="submit"
      variant="link"
    />
  );
};
