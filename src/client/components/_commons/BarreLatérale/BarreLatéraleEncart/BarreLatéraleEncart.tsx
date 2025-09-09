import { FunctionComponent, ReactNode } from "react";
import clsx from "clsx";
import BarreLatéraleEncartStyled from "./BarreLatéraleEncart.styled";

interface BarreLatéraleEncartProps {
  children: ReactNode;
  className?: string;
}

const BarreLatéraleEncart: FunctionComponent<BarreLatéraleEncartProps> = ({
  children,
  className = "bg-dsfr-blue-france-925",
}) => {
  return (
    <BarreLatéraleEncartStyled className={clsx("fr-p-3w w-full", className)}>
      {children}
    </BarreLatéraleEncartStyled>
  );
};

export default BarreLatéraleEncart;
