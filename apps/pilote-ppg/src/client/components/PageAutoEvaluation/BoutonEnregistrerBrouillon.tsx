import { SaveIcon } from "@/client/components/_commons/Icones/SaveIcon";
import { Button } from "@/components/shared/Button";

export const BoutonEnregistrerBrouillon = ({ formId }: { formId: string }) => {
  return (
    <Button
      className="!mt-2 !flex items-center"
      form={formId}
      iconLeft={<SaveIcon className="h-4 w-4" />}
      type="submit"
      variant="link"
    >
      Enregistrer le brouillon
    </Button>
  );
};
