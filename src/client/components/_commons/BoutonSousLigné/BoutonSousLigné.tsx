import { FunctionComponent, ComponentProps } from "react";
import clsx from "clsx";
import BoutonSousLignéStyled from "@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled";

type BoutonSousLignéProps = ComponentProps<"button"> & {
  dataFrOpened?: boolean;
};

const BoutonSousLigné: FunctionComponent<BoutonSousLignéProps> = ({
  className,
  dataFrOpened,
  ...props
}) => {
  return (
    <BoutonSousLignéStyled
      className={clsx("fr-link override", className)}
      data-fr-opened={dataFrOpened}
      {...props}
    />
  );
};

export default BoutonSousLigné;
