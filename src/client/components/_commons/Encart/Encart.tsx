import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

interface EncartProps {
  children: ReactNode;
  className?: string;
}

const Encart: FunctionComponent<EncartProps> = ({ children, className }) => {
  return (
    <div className={clsxm("encart-container py-4 px-8 bg-dsfr-blue-france-925", className)}>
      {children}
    </div>
  );
};

export default Encart;
