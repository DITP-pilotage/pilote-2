import { FunctionComponent } from "react";
import {
  JaugeDeProgressionCouleur,
  JaugeDeProgressionTaille,
} from "@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface";
import JaugeDeProgressionSVG from "@/components/_commons/JaugeDeProgression/JaugeDeProgressionSVG";
import { formaterDate } from "@/client/utils/date/date";
import { clsxm } from "@/utils/clsxm";

const COULEUR_TEXTE: Record<JaugeDeProgressionCouleur, string> = {
  bleu: "text-primary",
  "bleu-clair": "text-dsfr-info-main-525",
  violet: "text-pilote-ecart-blue",
  orange: "text-pilote-orange",
  vert: "text-pilote-vert",
  rose: "text-dsfr-pink-tuile-main-556",
  gris: "text-dsfr-grey-625",
};

const TAILLE_TRACÉ: Record<JaugeDeProgressionTaille, string> = {
  sm: "w-[3.75rem]",
  md: "w-[5.5rem] max-[80rem]:w-16",
  lg: "w-[10.5rem] max-[80rem]:w-[8.25rem]",
};

interface JaugeDeProgressionProps {
  couleur: JaugeDeProgressionCouleur;
  libellé: string;
  date?: string | null;
  pourcentage: number | null | undefined;
  taille: JaugeDeProgressionTaille;
  noWrap?: boolean;
}

const classesÀPartirDeTaille: Record<
  JaugeDeProgressionTaille,
  { valeur: string; libellé: string }
> = {
  sm: {
    valeur: "fr-h6",
    libellé: "",
  },
  md: {
    valeur:
      "absolute top-[calc(50%-1.4rem)] w-full !leading-10 fr-h4 text-center",
    libellé: "text-center",
  },
  lg: {
    valeur:
      "absolute top-[calc(50%-1.4rem)] w-full !leading-10 fr-h1 text-center",
    libellé: "text-center",
  },
};

const JaugeDeProgression: FunctionComponent<JaugeDeProgressionProps> = ({
  couleur,
  libellé,
  date,
  pourcentage,
  taille,
  noWrap = false,
}) => {
  return (
    <div className="relative flex flex-col items-center">
      <div className={clsxm("relative", TAILLE_TRACÉ[taille])}>
        <JaugeDeProgressionSVG
          couleur={couleur}
          pourcentage={pourcentage !== undefined ? pourcentage : null}
          taille={taille}
        />
        <p
          className={clsxm(
            "mb-0 break-normal text-center",
            COULEUR_TEXTE[couleur],
            classesÀPartirDeTaille[taille].valeur,
          )}
        >
          {`${pourcentage?.toFixed(0) ?? "- "}%`}
        </p>
      </div>
      <p
        className={clsxm(
          "fr-text--xs fr-mb-0 text-center",
          classesÀPartirDeTaille[taille].libellé,
          noWrap && "no-wrap",
        )}
      >
        {libellé}
      </p>
      {date ? (
        <p
          className={clsxm(
            "fr-text--xs fr-mb-0 text-center",
            classesÀPartirDeTaille[taille].libellé,
            noWrap && "no-wrap",
          )}
        >
          {`(${formaterDate(date, "MM/YYYY")})`}
        </p>
      ) : null}
    </div>
  );
};

export default JaugeDeProgression;
