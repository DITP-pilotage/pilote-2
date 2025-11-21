import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone1Icon } from "@/client/components/_commons/Icones/Icone1Icon";

export const BoutonEnregistrerBrouillon = ({ formId }: { formId: string }) => {
  return (
    <Bouton
      form={formId}
      iconLeft={<Icone1Icon className="h-4 w-4 mt-1" />}
      label="Enregistrer le brouillon"
      type="submit"
      variant="link"
    />
  );
};
