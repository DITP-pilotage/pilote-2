import { FunctionComponent } from "react";
import clsx from "clsx";

interface CompteurCaractèresProps {
  compte: number;
  limiteDeCaractères: number;
  className?: string;
}

const CompteurCaractères: FunctionComponent<CompteurCaractèresProps> = ({
  compte,
  limiteDeCaractères,
  className,
}) => {
  return (
    <p className={clsx("text-xs print:text-base mb-0 text-right", className)}>
      {compte}/{limiteDeCaractères}
    </p>
  );
};

export default CompteurCaractères;
