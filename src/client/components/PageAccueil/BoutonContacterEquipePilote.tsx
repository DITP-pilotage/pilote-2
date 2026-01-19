import { ComponentProps } from "react";
import { Icone } from "@/components/_commons/Icone";
import { EnveloppeContourIcon } from "@/components/_commons/Icones/EnveloppeContourIcon";
import { clsxm } from "@/utils/clsxm";
import { Lien } from "@/components/_commons/Lien/Lien";

export const BoutonContacterEquipePilote = ({
  variant = "primary",
}: {
  variant?: ComponentProps<typeof Lien>["variant"];
}) => (
  <Lien
    className={clsxm("!bg-none shadow-none !text-sm !font-normal")}
    href="mailto:pilote.ditp@modernisation.gouv.fr"
    iconLeft={<Icone className="text-current" icone={EnveloppeContourIcon} />}
    label={"Contacter l'équipe PILOTE"}
    variant={variant}
  />
);
