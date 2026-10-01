import { FunctionComponent, MouseEventHandler } from "react";
import { Button } from "@/components/shared/Button";

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
      className={`fr-btns-group fr-btns-group--inline fr-btns-group--sm${className ? " " + className : ""}`}
    >
      <li>
        <Button onClick={onClickToutSélectionner} variant="secondary">
          Tout sélectionner
        </Button>
      </li>
      <li>
        <Button onClick={onClickToutDésélectionner} variant="secondary">
          Tout déselectionner
        </Button>
      </li>
    </ul>
  );
};

export default BoutonToutSélectionner;
