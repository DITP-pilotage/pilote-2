import { Icone } from "@/components/_commons/Icone";
import { Button } from "@/components/shared/Button";
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
        <Button
          className="inline-flex items-center mt-1 text-sm"
          iconRight={<Icone className="h-4 w-4" icone={ArrowSLine2Icon} />}
          onClick={deplierLeContenu}
          variant="link"
        >
          Voir plus
        </Button>
      ) : null}
      {deplie ? (
        <Button
          className="inline-flex items-center text-sm"
          iconRight={<Icone className="h-4 w-4" icone={ArrowSLineIcon} />}
          onClick={replierLeContenu}
          variant="link"
        >
          Voir moins
        </Button>
      ) : null}
    </>
  );
};
