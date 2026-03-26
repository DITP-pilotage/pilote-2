import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

interface TitreInfobulleConteneurProps {
  className?: string;
  children: ReactNode;
}

const TitreInfobulleConteneur: FunctionComponent<
  TitreInfobulleConteneurProps
> = ({ className, children }) => {
  return (
    <div className={clsxm("relative flex align-center", className)}>
      {children}
    </div>
  );
};

export default TitreInfobulleConteneur;
