import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

interface BarreLatéraleEncartProps {
  children: ReactNode;
  className?: string;
}

const BarreLatéraleEncart: FunctionComponent<BarreLatéraleEncartProps> = ({
  children,
  className = "bg-dsfr-blue-france-925",
}) => {
  return (
    <div
      className={clsxm(
        "p-6 w-full [&_select]:bg-dsfr-alt-blue-france",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default BarreLatéraleEncart;
