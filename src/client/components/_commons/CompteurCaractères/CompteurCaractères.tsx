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
    <p className={clsx("fr-text--xs fr-mb-0 texte-droite", className)}>
      {compte}/{limiteDeCaractères}
    </p>
  );
};

export default CompteurCaractères;
