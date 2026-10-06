import { FunctionComponent, MouseEventHandler } from "react";
import { Button } from "@/components/shared/Button";
import { clsxm } from "@/utils/clsxm";

interface BoutonToutSélectionnerProps {
  onClickToutSélectionner: MouseEventHandler<HTMLButtonElement>;
  onClickToutDésélectionner: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const BoutonToutSélectionner: FunctionComponent<
  BoutonToutSélectionnerProps
> = ({
  onClickToutSélectionner,
  onClickToutDésélectionner,
  className = "",
}) => {
  return (
    <ul
      className={clsxm("flex flex-wrap gap-4 list-none pl-0 mb-4", className)}
    >
      <li className="pb-0">
        <Button onClick={onClickToutSélectionner} size="sm" variant="secondary">
          Tout sélectionner
        </Button>
      </li>
      <li className="pb-0">
        <Button
          onClick={onClickToutDésélectionner}
          size="sm"
          variant="secondary"
        >
          Tout déselectionner
        </Button>
      </li>
    </ul>
  );
};

export default BoutonToutSélectionner;
