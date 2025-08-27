import { FunctionComponent, ComponentProps } from "react";
import clsx from "clsx";
import BoutonSousLignéStyled from "@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled";

type BoutonSousLignéProps = ComponentProps<"button"> & {
  ariaControls?: string;
  dataFrOpened?: boolean;
};

const BoutonSousLigné: FunctionComponent<BoutonSousLignéProps> = ({
  ariaControls,
  className,
  dataFrOpened,
  ...props
}) => {
  return (
    <BoutonSousLignéStyled
      aria-controls={ariaControls}
      className={clsx("fr-link override", className)}
      data-fr-opened={dataFrOpened}
      {...props}
    />
  );
};

export default BoutonSousLigné;
