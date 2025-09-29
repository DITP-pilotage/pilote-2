import { FunctionComponent, MouseEventHandler } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { ArrowSLineIcon } from "@/components/_commons/Icones/ArrowSLineIcon";

interface BoutonsAffichageProps {
  afficherVoirPlus: boolean;
  afficherVoirMoins: boolean;
  déplierLeContenu: MouseEventHandler<HTMLButtonElement>;
  replierLeContenu: MouseEventHandler<HTMLButtonElement>;
}

export const BoutonsAffichage: FunctionComponent<BoutonsAffichageProps> = ({
  afficherVoirPlus,
  afficherVoirMoins,
  déplierLeContenu,
  replierLeContenu,
}) => {
  return (
    <>
      {afficherVoirPlus ? (
        <Bouton
          className="fr-btn--sm gap-2 fr-btn--tertiary-no-outline !p-0 !mt-2"
          iconRight={<Icone className="h-4 w-4" icone={ArrowSLine2Icon} />}
          label="Voir plus"
          onClick={déplierLeContenu}
        />
      ) : null}
      {afficherVoirMoins ? (
        <Bouton
          className="fr-btn--sm fr-btn--tertiary-no-outline !p-0 !mt-2"
          iconRight={<Icone className="h-4 w-4" icone={ArrowSLineIcon} />}
          label="Voir moins"
          onClick={replierLeContenu}
        />
      ) : null}
    </>
  );
};
