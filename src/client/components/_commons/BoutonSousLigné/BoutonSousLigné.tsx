import { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import BoutonSousLignéStyled from "@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled";

export const BoutonSousLigné = ({
  className,
  dataFrOpened,
  iconLeft,
  children,
  ...props
}: ComponentProps<"button"> & {
  dataFrOpened?: boolean;
  iconLeft?: ReactNode;
}) => {
  return (
    <BoutonSousLignéStyled
      className={clsx("!flex items-center gap-2 fr-link override", className, {
        "!opacity-80": props.disabled,
      })}
      data-fr-opened={dataFrOpened}
      {...props}
    >
      {iconLeft}
      {children}
    </BoutonSousLignéStyled>
  );
};
