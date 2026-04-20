import { ReactNode } from "react";

export type typeAlerte = "succès" | "erreur" | "info" | "warning";

export default interface AlerteProps {
  type: typeAlerte;
  titre?: string;
  message?: ReactNode;
  classesSupplementaires?: string;
  classesMessagePolice?: string;
}
