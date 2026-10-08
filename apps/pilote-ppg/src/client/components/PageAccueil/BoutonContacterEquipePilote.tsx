import { Icone } from "@/components/_commons/Icone";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { Button, ButtonVariant } from "@/components/shared/Button";

export const BoutonContacterEquipePilote = ({
  variant = "link",
}: {
  variant?: ButtonVariant;
}) => (
  <Button asChild className="text-sm font-normal bg-none" variant={variant}>
    <a href="mailto:pilote.ditp@modernisation.gouv.fr">
      <Icone className="text-current" icone={EnveloppeContourIcon} />
      Contacter l'équipe PILOTE
    </a>
  </Button>
);
