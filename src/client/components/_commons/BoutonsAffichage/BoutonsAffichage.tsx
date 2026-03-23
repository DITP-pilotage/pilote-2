import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { ArrowSLineIcon } from "@/components/_commons/Icones/ArrowSLineIcon";

interface BoutonsAffichageProps {
  deplie: boolean;
  deplierLeContenu: () => void;
  replierLeContenu: () => void;
}

export const BoutonsAffichage = ({
  deplie,
  deplierLeContenu,
  replierLeContenu,
}: BoutonsAffichageProps) => {
  return (
    <>
      {!deplie ? (
        <Bouton
          className="!inline-flex !items-center mt-1 !text-sm"
          iconRight={<Icone className="h-4 w-4" icone={ArrowSLine2Icon} />}
          label="Voir plus"
          onClick={deplierLeContenu}
          variant="link"
        />
      ) : null}
      {deplie ? (
        <Bouton
          className="!inline-flex !items-center !text-sm"
          iconRight={<Icone className="h-4 w-4" icone={ArrowSLineIcon} />}
          label="Voir moins"
          onClick={replierLeContenu}
          variant="link"
        />
      ) : null}
    </>
  );
};
