import { Icone } from "@/components/_commons/Icone";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { Button, ButtonVariant } from "@/components/shared/Button";

export const PILOTE_TEAM_EMAIL = "pilote.ditp@modernisation.gouv.fr";

export const BoutonContacterEquipePilote = ({
  variant = "link",
  onClick,
}: {
  variant?: ButtonVariant;
  onClick?: () => void;
}) => (
  <Button asChild className="text-sm font-normal bg-none" variant={variant}>
    <a href={`mailto:${PILOTE_TEAM_EMAIL}`} onClick={onClick}>
      <Icone className="text-current" icone={EnveloppeContourIcon} />
      Contacter l'équipe PILOTE
    </a>
  </Button>
);
