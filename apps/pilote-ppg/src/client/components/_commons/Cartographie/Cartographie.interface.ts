import { ReactNode } from "react";
import { CodeInsee } from "@/shared/territoire/Territoire.interface";

export type CartographieDonnées = {
  [key in CodeInsee]: {
    contenu: ReactNode;
    remplissage: string;
    libellé: string;
    estApplicable: boolean | null;
  };
};
