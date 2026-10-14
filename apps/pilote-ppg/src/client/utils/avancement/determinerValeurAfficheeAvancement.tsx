import { ReactNode } from "react";

export const determinerValeurAfficheeAvancement = (
  valeurAnnuelle: number | null,
  estApplicable: boolean | null,
  jalon: number,
): ReactNode => {
  if (estApplicable === false) {
    return <span className="font-bold">Non applicable</span>;
  }

  if (valeurAnnuelle === null) {
    return <span className="font-bold">Non renseigné</span>;
  }

  return <>{`TA ${jalon} : ${valeurAnnuelle.toFixed(0)}%`}</>;
};
