import Link from "next/link";
import { Icone } from "@/components/_commons/Icone";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { clsxm } from "@/utils/clsxm";

export const BoutonContacterEquipePilote = ({
  className,
}: {
  className?: string;
}) => (
  <button
    className={clsxm("fr-btn fr-text--sm fr-py-0 fr-pr-1w fr-pl-0", className)}
    type="button"
  >
    <Icone className="fr-mr-2v text-current" icone={EnveloppeContourIcon} />
    <Link
      className="font-normal"
      href="mailto:pilote.ditp@modernisation.gouv.fr"
      title="Contacter l'équipe PILOTE"
    >
      Contacter l'équipe PILOTE
    </Link>
  </button>
);
